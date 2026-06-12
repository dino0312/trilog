#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = resolve(root, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const [major] = pkg.version.split('.').map(Number)
pkg.version = `${major + 1}.0.000`

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(pkg.version)
