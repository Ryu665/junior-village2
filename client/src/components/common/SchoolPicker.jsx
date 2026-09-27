import { useEffect, useRef, useState } from "react";
import { searchSchools } from "../../api/schools";

/**
 * 실제 존재하는 학교를 나이스(NEIS) 교육정보 개방포털에서 검색해 선택하는 컴포넌트.
 * onSelect({ atptCode, schoolCode, name, address }) 로 결과를 돌려준다.
 */
export default function SchoolPicker({ onSelect, placeholder = "학교 이름을 입력하세요 (예: 서울대학교초등학교)" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await searchSchools(query.trim());
        setResults(rows);
        if (rows.length === 0) setError("검색 결과가 없어요. 학교 이름을 다시 확인해주세요.");
      } catch (e) {
        setError(e.response?.data?.error || "학교 검색에 실패했어요.");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const pick = (school) => {
    setSelected(school);
    setResults([]);
    setQuery(school.name);
    onSelect(school);
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selected) {
            setSelected(null);
            onSelect(null);
          }
        }}
        placeholder={placeholder}
        className="tap-target w-full border-2 border-gray-200 rounded-xl px-3 py-3"
      />
      {loading && <p className="text-xs text-gray-400 mt-1">검색 중...</p>}
      {!loading && error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {results.length > 0 && (
        <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-card max-h-56 overflow-y-auto">
          {results.map((s) => (
            <button
              key={`${s.atptCode}-${s.schoolCode}`}
              type="button"
              onClick={() => pick(s)}
              className="w-full text-left px-3 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-junior-50 active:bg-junior-100"
            >
              <p className="font-bold text-sm text-gray-800">{s.name}</p>
              <p className="text-xs text-gray-400">
                {s.region} · {s.kind}
                {s.address ? ` · ${s.address}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <p className="text-xs text-junior-600 font-semibold mt-1">
          ✓ {selected.name} 선택됨 ({selected.region})
        </p>
      )}
    </div>
  );
}
