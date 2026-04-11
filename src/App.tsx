import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center font-display text-3xl text-text-primary">
      {name}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col bg-bg-primary text-text-primary font-body">
        <Routes>
          <Route path="/" element={<Placeholder name="SG Math Whiz" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
