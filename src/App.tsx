import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Dashboard, Capture, Notes, SetLists, Venues, Contacts } from './pages'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="capture" element={<Capture />} />
          <Route path="notes" element={<Notes />} />
          <Route path="setlists" element={<SetLists />} />
          <Route path="venues" element={<Venues />} />
          <Route path="contacts" element={<Contacts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
