import { useEffect, useState } from "react";
import BackHeader from "../components/common/BackHeader";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmojiPicker from "../components/common/EmojiPicker";
import SchoolPicker from "../components/common/SchoolPicker";
import Avatar from "../components/common/Avatar";
import { useAuthStore } from "../store/authStore";
import { changeAvatar, changePin } from "../api/auth";
import { registerMySchool } from "../api/users";
import { fetchSchools } from "../api/games";

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const tone = user.role === "PARENT" ? "parent" : "junior";
  const [avatar, setAvatar] = useState(user.avatarEmoji);
  const [avatarMsg, setAvatarMsg] = useState("");

  const [currentSchoolName, setCurrentSchoolName] = useState("");
  const [pickedSchool, setPickedSchool] = useState(null);
  const [schoolMsg, setSchoolMsg] = useState("");
  const [schoolError, setSchoolError] = useState("");

  useEffect(() => {
    if (user.role !== "CHILD" || !user.schoolId) return;
    fetchSchools().then((schools) => {
      setCurrentSchoolName(schools.find((s) => s.id === user.schoolId)?.name || "");
    });
  }, [user.role, user.schoolId]);

  const saveSchool = async () => {
    if (!pickedSchool) return;
    setSchoolError("");
    try {
      const res = await registerMySchool(pickedSchool);
      updateUser({ schoolId: res.schoolId });
      setCurrentSchoolName(res.school);
      setSchoolMsg("학교가 등록됐어요!");
      setTimeout(() => setSchoolMsg(""), 2000);
    } catch (e) {
      setSchoolError(e.response?.data?.error || "학교 등록에 실패했어요.");
    }
  };

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [pinError, setPinError] = useState("");

  const saveAvatar = async (emoji) => {
    setAvatar(emoji);
    await changeAvatar(emoji);
    updateUser({ avatarEmoji: emoji });
    setAvatarMsg("대표 이모지가 변경됐어요!");
    setTimeout(() => setAvatarMsg(""), 2000);
  };

  const savePin = async (e) => {
    e.preventDefault();
    setPinError("");
    setPinMsg("");
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError("새 PIN은 숫자 4자리로 입력해주세요.");
      return;
    }
    if (newPin !== newPin2) {
      setPinError("새 PIN이 서로 일치하지 않아요.");
      return;
    }
    try {
      await changePin(currentPin, newPin);
      setPinMsg("PIN이 변경됐어요!");
      setCurrentPin("");
      setNewPin("");
      setNewPin2("");
    } catch (e2) {
      setPinError(e2.response?.data?.error || "PIN 변경에 실패했어요.");
    }
  };

  return (
    <div>
      <BackHeader title="설정" tone={tone} />
      <div className="p-4 flex flex-col gap-4">
        <Card>
          <p className="font-bold text-gray-700 mb-3">🙂 대표 이미지(캐릭터) 변경</p>
          <div className="flex justify-center mb-3">
            <Avatar value={avatar} className="w-16 h-16" textClassName="text-5xl" />
          </div>
          <EmojiPicker value={avatar} onChange={saveAvatar} mode={user.role === "CHILD" ? "character" : "emoji"} />
          {avatarMsg && <p className="text-junior-600 text-sm text-center mt-2 font-medium">{avatarMsg}</p>}
        </Card>

        {user.role === "CHILD" && (
          <Card>
            <p className="font-bold text-gray-700 mb-1">🏫 내 학교 등록/변경</p>
            <p className="text-xs text-gray-400 mb-3">
              {currentSchoolName ? `현재 등록된 학교: ${currentSchoolName}` : "아직 등록된 학교가 없어요."} 게임 랭킹과
              급식메뉴 조회에 사용돼요.
            </p>
            <SchoolPicker onSelect={setPickedSchool} placeholder="내 학교 이름을 검색하세요" />
            {schoolError && <p className="text-red-500 text-sm mt-2">{schoolError}</p>}
            {schoolMsg && <p className="text-junior-600 text-sm mt-2 font-medium">{schoolMsg}</p>}
            <Button tone={tone} className="mt-3" onClick={saveSchool} disabled={!pickedSchool}>
              학교 저장하기
            </Button>
          </Card>
        )}

        <Card>
          <p className="font-bold text-gray-700 mb-3">🔒 비밀번호(PIN) 변경</p>
          <form onSubmit={savePin} className="flex flex-col gap-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="현재 PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-center tracking-widest"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 PIN (숫자 4자리)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-center tracking-widest"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 PIN 확인"
              value={newPin2}
              onChange={(e) => setNewPin2(e.target.value.replace(/\D/g, ""))}
              className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-center tracking-widest"
            />
            {pinError && <p className="text-red-500 text-sm">{pinError}</p>}
            {pinMsg && <p className="text-junior-600 text-sm font-medium">{pinMsg}</p>}
            <Button tone={tone} type="submit">
              PIN 변경하기
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
