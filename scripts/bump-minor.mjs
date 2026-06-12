#!/usr/bin/env node
// Bumps minor version and resets patch to 000.
// Used by prebuild on Vercel (VERCEL=1 env is set automatically).
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = resolve(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const [major, minor] = pkg.version.split('.').map(Number)
pkg.version = `${major}.${minor + 1}.000`

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`version bumped to ${pkg.version}`)
