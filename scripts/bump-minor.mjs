#!/usr/bin/env node
// Bumps minor, keeps patch cumulative (never resets), appends date suffix
// e.g. 0.6.007-... → 0.7.008-26062601
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = resolve(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

// Strip existing suffix to get base semver
const [base] = pkg.version.split('-')
const [major, minor, patch] = base.split('.').map(Number)
const nextPatch = String(patch + 1).padStart(3, '0')

// Date: YYMMDD
const now = new Date()
const yy = String(now.getFullYear()).slice(2)
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const today = `${yy}${mm}${dd}`

// Daily sequence: if current version already has today's date, increment; else 01
const suffix = pkg.version.split('-')[1] ?? ''
const existingDate = suffix.slice(0, 6)
const existingSeq = parseInt(suffix.slice(6) || '0', 10)
const seq = String(existingDate === today ? existingSeq + 1 : 1).padStart(2, '0')

pkg.version = `${major}.${minor + 1}.${nextPatch}-${today}${seq}`

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(pkg.version)
