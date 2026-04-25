import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
const model = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!).getGenerativeModel({ model: 'gemini-2.0-flash' })
const r = await model.generateContent('Say hello in one word')
console.log('✓ API working:', r.response.text().trim())
