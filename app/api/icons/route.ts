import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicIconsPath = path.join(process.cwd(), 'public', 'icons')
    const files = fs.readdirSync(publicIconsPath)
    
    // Filter for image files
    const icons = files.filter(file => 
      /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file)
    )

    return NextResponse.json({ icons })
  } catch (error) {
    console.error('Error reading icons directory:', error)
    return NextResponse.json({ icons: [] })
  }
} 