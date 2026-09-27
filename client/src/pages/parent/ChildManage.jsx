import { useEffect, useState } from "react";
import BackHeader from "../../components/common/BackHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmojiPicker from "../../components/common/EmojiPicker";
import SchoolPicker from "../../components/common/SchoolPicker";
import Avatar from "../../components/common/Avatar";
import { DEFAULT_CHILD_AVATAR } from "../../data/avatarCharacters";
import { fetchChildren, createChild, registerChildSchool, deleteChild, changeChildAvatar } from "../../api/users";

function ChildSchoolEditor({ child, onSaved, onCancel }) {
  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    setError("");
    try {
      await registerChildSchool(child.id, picked);
      onSaved();
    } catch (e) {
      setError(e.response?.data?.error || "학교 등록에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <SchoolPicker onSelect={setPicked} placeholder="자녀의 학교 이름을 검색하세요" />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <div className="flex gap-2 mt-2">
        <Button tone="outline" onClick={onCancel} className="text-sm">
          취소
        </Button>
        <Button tone="parent" onClick={save} disabled={!picked || saving} className="text-sm">
          저장
        </Button>
      </div>
    </div>
  );
}

function ChildAvatarEditor({ child, onSaved, onCancel }) {
  const [picked, setPicked] = useState(child.avatarEmoji);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await changeChildAvatar(child.id, picked);
      onSaved();
    } catch (e) {
      setError(e.response?.data?.error || "이미지 변경에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <EmojiPicker value={picked} onChange={setPicked} mode="character" />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <div className="flex gap-2 mt-2">
        <Button tone="outline" onClick={onCancel} className="text-sm">
          취소
        </Button>
        <Button tone="parent" onClick={save} disabled={picked === child.avatarEmoji || saving} className="text-sm">
          저장
        </Button>
      </div>
    </div>
  );
}

export default function ChildManage() {
  const [children, setChildren] = useState([]);
  const [editingSchoolFor, setEditingSchoolFor] = useState(null);
  const [editingAvatarFor, setEditingAvatarFor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", pin: "", avatarEmoji: DEFAULT_CHILD_AVATAR, school: null });
  const [lastCreated, setLastCreated] = useState(null);
  const [error, setError] = useState("");
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => fetchChildren().then(setChildren);
  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (childId) => {
    setDeletingId(childId);
    try {
      await deleteChild(childId);
      setConfirmDeleteFor(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "자녀 계정 삭제에 실패했어요.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(form.pin)) {
      setError("PIN은 숫자 4자리로 입력해주세요.");
      return;
    }
    try {
      const created = await createChild(form);
      setLastCreated(created);
      setForm({ name: "", pin: "", avatarEmoji: DEFAULT_CHILD_AVATAR, school: null });
      setShowForm(false);
      load();
    } catch (e2) {
      setError(e2.response?.data?.error || "자녀 계정 생성에 실패했어요.");
    }
  };

  return (
    <div>
      <BackHeader title="자녀 계정 관리" tone="parent" />
      <div className="p-4 flex flex-col gap-4">
        {lastCreated && (
          <Card className="bg-amber-50 border border-amber-200">
            <p className="font-bold text-amber-700 mb-1">🎉 {lastCreated.name} 계정이 만들어졌어요!</p>
            <p className="text-sm text-amber-600">
              초대 코드 <span className="font-mono font-bold">{lastCreated.inviteCode}</span> (데모용 표시)
            </p>
            <p className="text-xs text-amber-500 mt-1">계정 선택 화면에서 바로 로그인할 수 있어요.</p>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {children.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <Avatar value={c.avatarEmoji} className="w-11 h-11" textClassName="text-3xl" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.school || "소속 학교 미등록"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setEditingAvatarFor(editingAvatarFor === c.id ? null : c.id)}
                  className="text-xs font-bold text-parent-600 bg-parent-50 rounded-full px-3 py-1.5 whitespace-nowrap"
                >
                  🖼️ 이미지 변경
                </button>
                <button
                  onClick={() => setEditingSchoolFor(editingSchoolFor === c.id ? null : c.id)}
                  className="text-xs font-bold text-parent-600 bg-parent-50 rounded-full px-3 py-1.5 whitespace-nowrap"
                >
                  🏫 {c.school ? "학교 변경" : "학교 등록"}
                </button>
                <button
                  onClick={() => setConfirmDeleteFor(confirmDeleteFor === c.id ? null : c.id)}
                  className="text-xs font-bold text-red-500 bg-red-50 rounded-full px-3 py-1.5 whitespace-nowrap"
                >
                  🗑️ 삭제
                </button>
              </div>
              {editingAvatarFor === c.id && (
                <ChildAvatarEditor
                  child={c}
                  onSaved={() => {
                    setEditingAvatarFor(null);
                    load();
                  }}
                  onCancel={() => setEditingAvatarFor(null)}
                />
              )}
              {editingSchoolFor === c.id && (
                <ChildSchoolEditor
                  child={c}
                  onSaved={() => {
                    setEditingSchoolFor(null);
                    load();
                  }}
                  onCancel={() => setEditingSchoolFor(null)}
                />
              )}
              {confirmDeleteFor === c.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-red-500 font-medium mb-2">
                    정말 {c.name} 계정을 삭제할까요? 미션·저축·게임 기록이 모두 함께 삭제되고 되돌릴 수 없어요.
                  </p>
                  <div className="flex gap-2">
                    <Button tone="outline" onClick={() => setConfirmDeleteFor(null)} className="text-sm">
                      취소
                    </Button>
                    <Button
                      tone="danger"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-sm"
                    >
                      삭제하기
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {children.length === 0 && <p className="text-center text-gray-400 py-8">아직 등록된 자녀가 없어요.</p>}
        </div>

        <Button tone="parent" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "닫기" : "+ 자녀 계정 추가"}
        </Button>

        {showForm && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                required
                placeholder="자녀 이름"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3"
              />
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="PIN 번호 4자리"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-center tracking-widest"
              />
              <p className="text-sm font-medium text-gray-600">소속 초등학교 (선택)</p>
              <SchoolPicker onSelect={(school) => setForm({ ...form, school })} />
              <p className="text-sm font-medium text-gray-600">대표 이미지</p>
              <EmojiPicker
                value={form.avatarEmoji}
                onChange={(e) => setForm({ ...form, avatarEmoji: e })}
                mode="character"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button tone="parent" type="submit">
                자녀 계정 만들기
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
