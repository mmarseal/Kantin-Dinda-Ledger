import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InputTransaksi from "./pages/InputTransaksi";
import BukuKas from "./pages/BukuKas";
import RekapMenu from "./pages/RekapMenu";
import KelolaMenu from "./pages/KelolaMenu";
import ExportLaporan from "./pages/ExportLaporan";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="catat" element={<InputTransaksi />} />
          <Route path="riwayat" element={<BukuKas />} />
          <Route path="rekap" element={<RekapMenu />} />
          <Route path="kelola-menu" element={<KelolaMenu />} />
          <Route path="export" element={<ExportLaporan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
