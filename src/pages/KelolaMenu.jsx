import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";

export default function KelolaMenu() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchMenus() {
    setLoading(true);
    const { data } = await supabase
      .from("menus")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setMenus(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchMenus();
  }, []);

  async function handleTambah() {
    setError("");
    if (!newName.trim()) return setError("Nama menu tidak boleh kosong.");
    const duplikat = menus.find(
      (m) => m.name.toLowerCase() === newName.trim().toLowerCase(),
    );
    if (duplikat) return setError("Menu sudah ada di daftar.");

    setSaving(true);
    const { error } = await supabase
      .from("menus")
      .insert({ user_id: userId, name: newName.trim() });
    if (!error) {
      setNewName("");
      fetchMenus();
    } else setError("Gagal menyimpan. Coba lagi.");
    setSaving(false);
  }

  async function toggleAktif(menu) {
    await supabase
      .from("menus")
      .update({ is_active: !menu.is_active })
      .eq("id", menu.id);
    setMenus((prev) =>
      prev.map((m) =>
        m.id === menu.id ? { ...m, is_active: !m.is_active } : m,
      ),
    );
  }

  async function handleHapus(id) {
    await supabase.from("menus").delete().eq("id", id);
    setMenus((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 md:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-green-100 mb-3"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1 className="text-white text-2xl font-bold">Kelola Menu</h1>
        <p className="text-green-100 text-sm mt-1">Setup daftar menu kantin</p>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-4 pb-8">
        {/* Form Tambah */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Tambah Menu Baru
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: Ayam Bakar"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleTambah()}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition-colors"
            />
            <button
              onClick={handleTambah}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-3 rounded-xl font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Plus size={18} />
              {saving ? "Simpan..." : "Tambah"}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>

        {/* Daftar Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">
              Daftar Menu{" "}
              <span className="text-gray-400 font-normal">
                ({menus.length} menu)
              </span>
            </p>
          </div>

          {loading ? (
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto text-gray-300 mb-2" size={36} />
              <p className="text-gray-400 text-sm">
                Belum ada menu. Tambah dulu!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  {/* Nama */}
                  <p
                    className={`flex-1 text-sm font-medium ${menu.is_active ? "text-gray-800" : "text-gray-400 line-through"}`}
                  >
                    {menu.name}
                  </p>

                  {/* Badge aktif/nonaktif */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      menu.is_active
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {menu.is_active ? "Aktif" : "Nonaktif"}
                  </span>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAktif(menu)}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    {menu.is_active ? (
                      <ToggleRight size={24} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>

                  {/* Hapus */}
                  <button
                    onClick={() => handleHapus(menu.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
