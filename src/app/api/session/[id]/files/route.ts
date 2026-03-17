import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin, hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { getSessionDB } from '@/lib/db/sessions'
import { saveFileDB, deleteFileDB } from '@/lib/db/sessions'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
}

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  docx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP-based)
  xlsx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP-based)
}

function checkMagicBytes(buffer: Buffer, fileType: string): boolean {
  const ext = ALLOWED_TYPES[fileType]
  const magic = MAGIC_BYTES[ext]
  if (!magic) return true // skip check if unknown
  return magic.every((byte, i) => buffer[i] === byte)
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = ALLOWED_TYPES[mimeType]

  if (ext === 'pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((await import('pdf-parse' as any)) as any).default ?? (await import('pdf-parse' as any))
      const result = await pdfParse(buffer)
      return (result.text as string).slice(0, 8000)
    } catch {
      return ''
    }
  }

  if (ext === 'docx' || ext === 'doc') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth = (await import('mammoth' as any)) as any
      const result = await mammoth.extractRawText({ buffer })
      return (result.value as string).slice(0, 8000)
    } catch {
      return ''
    }
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (await import('xlsx' as any)) as any
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const csv = XLSX.utils.sheet_to_csv(firstSheet) as string
      return csv.slice(0, 8000)
    } catch {
      return ''
    }
  }

  return ''
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  }

  // Auth
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify session ownership
  const session = await getSessionDB(params.id)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  const sessionRow = session as { user_id?: string }
  if (sessionRow.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check file count limit (max 3 per session)
  const { count } = await supabaseAdmin
    .from('session_files')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', params.id)
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'حد الملفات: 3 ملفات كحد أقصى لكل جلسة' }, { status: 400 })
  }

  // Parse form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: 'نوع الملف غير مدعوم. الأنواع المدعومة: PDF, Word, Excel' },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'حجم الملف يتجاوز الحد المسموح به (10 ميجابايت)' },
      { status: 400 }
    )
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Verify magic bytes
  if (!checkMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: 'محتوى الملف لا يتطابق مع نوعه' },
      { status: 400 }
    )
  }

  // Upload to Supabase Storage
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${params.id}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabaseAdmin
    .storage
    .from('session-files')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[Files] Upload error:', uploadError)
    return NextResponse.json(
      { error: 'فشل رفع الملف. حاول مرة أخرى.' },
      { status: 500 }
    )
  }

  // Extract text
  const extractedText = await extractTextFromBuffer(buffer, file.type)

  // Save to DB
  const fileRecord = await saveFileDB(params.id, {
    file_name: file.name,
    storage_path: storagePath,
    file_type: file.type,
    file_size: file.size,
    extracted_text: extractedText || null,
  })

  return NextResponse.json({
    fileId: fileRecord?.id,
    fileName: file.name,
    fileSize: file.size,
    extractedLength: extractedText.length,
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileId } = await req.json() as { fileId: string }
  if (!fileId) {
    return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  }

  // Get the file to check ownership and get storage path
  const { data: fileRow } = await supabaseAdmin
    .from('session_files')
    .select('*, sessions!inner(user_id)')
    .eq('id', fileId)
    .eq('session_id', params.id)
    .single()

  if (!fileRow) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const sessionOwner = (fileRow as { sessions: { user_id: string } }).sessions?.user_id
  if (sessionOwner !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete from storage
  await supabaseAdmin
    .storage
    .from('session-files')
    .remove([fileRow.storage_path])

  // Delete from DB
  await deleteFileDB(fileId)

  return NextResponse.json({ success: true })
}
