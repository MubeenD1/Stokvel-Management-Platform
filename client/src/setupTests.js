import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Fixes the "TextEncoder is not defined" error
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder