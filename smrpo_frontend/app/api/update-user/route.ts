import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export async function GET() {
  return NextResponse.json({ message: 'Use POST to update user' })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const userName = formData.get('userName')?.toString()
    const firstName = formData.get('firstName')?.toString()
    const lastName = formData.get('lastName')?.toString()
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    }

    const updateClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (userName) {
      updateClauses.push(`"userName" = $${paramIndex++}`)
      values.push(userName)
    }
    if (firstName) {
      updateClauses.push(`"firstName" = $${paramIndex++}`)
      values.push(firstName)
    }
    if (lastName) {
      updateClauses.push(`"lastName" = $${paramIndex++}`)
      values.push(lastName)
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10)
      updateClauses.push(`"password" = $${paramIndex++}`)
      values.push(hashed)
    }

    if (updateClauses.length === 0) {
      return NextResponse.json({ message: 'No fields to update.' }, { status: 400 })
    }

    values.push(email)
    const sql = `
      UPDATE users
      SET ${updateClauses.join(', ')}
      WHERE email = $${paramIndex}
      RETURNING *
    `
    const result = await pool.query(sql, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Profile updated!', data: result.rows[0] }, { status: 200 })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 })
  }
}