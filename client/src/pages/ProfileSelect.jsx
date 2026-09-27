import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfiles, pinLogin } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import mainImage from "../assets/mainimage.png";
import Avatar from "../components/common/Avatar";

const PIN_LENGTH = 4;

function PinPad({ profile, onBack, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const tone = profile.role === "PARENT" ? "parent" : "junior";

  const submit = async (fullPin) => {
    setLoading(true);
    setError("");
    try {
      const data = await pinLogin(profile.id, fullPin);
      onSuccess(data);
    } catch (e) {
      setError(e.response?.data?.error || "로그인에 실패했어요. 다시 시도해주세요.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const press = (digit) => {
    if (loading) return;
    const next = (pin + digit).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="flex flex-col items-center px-6 py-8 animate-pop-in">
      <div className="mb-2">
        <Avatar value={profile.avatarEmoji} className="w-16 h-16" textClassName="text-5xl" />
      </div>
      <p className="font-bold text-lg mb-1">{profile.name}</p>
      <p className="text-gray-400 text-sm mb-6">PIN 번호 4자리를 입력해주세요</p>

      <div className="flex gap-3 mb-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < pin.length ? (tone === "parent" ? "bg-parent-600 border-parent-600" : "bg-junior-500 border-junior-500") : "border-gray-300"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mb-2 h-5">{error}</p>}
      {!error && <div className="h-5 mb-2" />}

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            onClick={() => press(n)}
            className="tap-target text-xl font-bold py-4 rounded-2xl bg-gradient-to-b from-white to-gray-100 shadow-card hover:to-gray-200 active:scale-95 active:shadow-none transition-all"
          >
            {n}
          </button>
        ))}
        <button onClick={onBack} className="tap-target py-4 rounded-2xl text-gray-400 font-medium">
          취소
        </button>
        <button onClick={() => press("0")} className="tap-target text-xl font-bold py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-transform">
          0
        </button>
        <button onClick={backspace} className="tap-target py-4 rounded-2xl text-gray-400 font-bold">
          ⌫
        </button>
      </div>
    </div>
  );
}

function ManualLogin({ profiles, onBack, onSuccess }) {
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await pinLogin(profileId, pin);
      onSuccess(data);
    } catch (e2) {
      setError(e2.response?.data?.error || "로그인에 실패했어요.");
    }
  };

  return (
    <form onSubmit={submit} className="px-6 py-8 flex flex-col gap-4 animate-pop-in">
      <h2 className="font-bold text-lg text-center mb-2">다른 계정으로 로그인</h2>
      <label className="text-sm font-medium text-gray-600">계정 선택</label>
      <select
        value={profileId}
        onChange={(e) => setProfileId(e.target.value)}
        className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.role === "PARENT" ? "부모" : "자녀"})
          </option>
        ))}
      </select>
      <label className="text-sm font-medium text-gray-600">PIN 번호</label>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 tracking-widest text-center text-xl"
        placeholder="••••"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="btn-big bg-junior-500 text-white">
        로그인
      </button>
      <button type="button" onClick={onBack} className="text-gray-400 text-sm font-medium py-2">
        계정 목록으로 돌아가기
      </button>
    </form>
  );
}

export default function ProfileSelect() {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("list"); // list | pin | manual
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch(() => setLoadError("서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해주세요."));
  }, []);

  const handleSuccess = ({ accessToken, user }) => {
    setAuth(accessToken, user);
    navigate("/home");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="relative">
        <img src={mainImage} alt="주니어빌리지" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
          <h1 className="text-white font-extrabold text-2xl drop-shadow">주니어빌리지</h1>
        </div>
      </div>

      {mode === "pin" && selected ? (
        <PinPad profile={selected} onBack={() => setMode("list")} onSuccess={handleSuccess} />
      ) : mode === "manual" ? (
        <ManualLogin profiles={profiles} onBack={() => setMode("list")} onSuccess={handleSuccess} />
      ) : (
        <div className="flex-1 flex flex-col px-5 py-6">
          <p className="text-center text-gray-500 mb-5 font-medium">우리 가족 계정을 선택해주세요</p>
          {loadError && <p className="text-center text-red-500 text-sm mb-4">{loadError}</p>}
          <div className="flex flex-col gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setMode("pin");
                }}
                className={`flex items-center gap-4 rounded-2xl p-4 shadow-card ring-1 active:scale-[0.98] active:shadow-none transition-all ${
                  p.role === "PARENT"
                    ? "bg-gradient-to-b from-parent-50 to-parent-100 ring-parent-200/60"
                    : "bg-gradient-to-b from-junior-50 to-junior-100 ring-junior-200/60"
                }`}
              >
                <Avatar value={p.avatarEmoji} className="w-12 h-12" textClassName="text-4xl" />
                <div className="text-left">
                  <p className="font-bold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.role === "PARENT" ? "부모(보호자) 계정" : "자녀(주니어) 계정"}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1" />
          <button onClick={() => setMode("manual")} className="text-gray-400 text-sm font-medium py-3 underline underline-offset-2">
            다른 계정으로 로그인
          </button>
        </div>
      )}
    </div>
  );
}
