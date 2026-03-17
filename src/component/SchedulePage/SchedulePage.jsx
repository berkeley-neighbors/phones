import { useState, useEffect, useContext, useMemo } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import { APIContext } from "@/context/APIContext";
import dayjs from "dayjs";
import "./SchedulePage.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
  { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
];

function getUserColor(uid, uidList) {
  const index = uidList.indexOf(uid);
  return COLORS[(index >= 0 ? index : 0) % COLORS.length];
}

function getCalendarDays(month) {
  const startOfMonth = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const startDay = startOfMonth.day();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(month.date(d));
  }
  return days;
}

function getEventsForDate(date, schedules) {
  const dayOfWeek = date.day();
  const dateStr = date.format("YYYY-MM-DD");

  return schedules.filter(s => {
    if (s.always) {
      return true;
    }
    if (s.recurring && s.day_of_week === dayOfWeek && dateStr >= s.date) {
      return true;
    }
    if (!s.recurring && s.date === dateStr) {
      return true;
    }
    return false;
  });
}

function maskPhone(phone) {
  if (!phone) return "";
  const len = phone.length;
  if (len <= 4) return phone;
  return "*".repeat(len - 4) + phone.slice(-4);
}

export const SchedulePage = () => {
  const api = useContext(APIContext);
  const { addNotification } = useSnackbar();

  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [schedules, setSchedules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [recurring, setRecurring] = useState(false);

  // Profile setup
  const [phoneInput, setPhoneInput] = useState("");
  const [settingProfile, setSettingProfile] = useState(false);

  const uidList = useMemo(() => {
    return [...new Set(schedules.map(s => s.uid))];
  }, [schedules]);

  useEffect(() => {
    loadProfile();
    loadSchedules();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/api/schedules/profile");
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const { data } = await api.get("/api/schedules");
      setSchedules(data || []);
    } catch (error) {
      addNotification(`Error loading schedules: ${error.message}`, "error", "schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSetProfile = async e => {
    e.preventDefault();
    setSettingProfile(true);

    try {
      const { data } = await api.post("/api/schedules/profile", {
        phone_number: phoneInput,
      });
      setProfile(data);
      setPhoneInput("");
      addNotification("Phone number linked successfully!", "success", "phone-link");
    } catch (error) {
      addNotification(error.response?.data?.error || error.message, "error", "phone-link");
    } finally {
      setSettingProfile(false);
    }
  };

  const handleUnlinkProfile = async () => {
    try {
      await api.delete("/api/schedules/profile");
      setProfile({ uid: profile.uid, phone_number: null });
      setSchedules(schedules.filter(s => s.uid !== profile.uid));
      addNotification("Phone number unlinked", "success", "phone-link");
    } catch (error) {
      addNotification(error.message, "error", "phone-link");
    }
  };

  const handleDayClick = date => {
    if (!profile?.phone_number) {
      addNotification("Please link your phone number first", "error", "phone-link");
      return;
    }
    if (date.format("YYYY-MM-DD") < today) {
      return;
    }
    setSelectedDate(date);
    setStartTime("09:00");
    setEndTime("17:00");
    setRecurring(false);
    setShowModal(true);
  };

  const handleCreateSchedule = async e => {
    e.preventDefault();

    if (startTime >= endTime) {
      addNotification("End time must be after start time", "error", "schedule");
      return;
    }

    try {
      await api.post("/api/schedules", {
        date: selectedDate.format("YYYY-MM-DD"),
        day_of_week: selectedDate.day(),
        start_time: startTime,
        end_time: endTime,
        recurring,
      });
      addNotification("Schedule created!", "success", "schedule");
      setShowModal(false);
      await loadSchedules();
    } catch (error) {
      addNotification(error.response?.data?.error || error.message, "error", "schedule");
    }
  };

  const handleDeleteSchedule = async id => {
    if (!window.confirm("Delete this schedule entry?")) return;

    try {
      await api.delete(`/api/schedules/${id}`);
      addNotification("Schedule deleted", "success", "schedule");
      setShowModal(false);
      await loadSchedules();
    } catch (error) {
      addNotification(error.response?.data?.error || error.message, "error", "schedule");
    }
  };

  const calendarDays = getCalendarDays(currentMonth);
  const today = dayjs().format("YYYY-MM-DD");
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate, schedules) : [];

  return (
    <Layout title="Schedule">
      <p className="text-gray-600 mb-4">Manage on-call schedules</p>

      {/* Profile Setup */}
      {profileLoading ? (
        <div className="text-gray-500 mb-4">Loading profile...</div>
      ) : !profile?.phone_number ? (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-amber-800 mb-2">Link Your Phone Number</h3>
          <p className="text-sm text-amber-700 mb-3">
            Enter your phone number to manage your on-call schedule. It must match a number in the staff directory.
          </p>
          <form onSubmit={handleSetProfile} className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="+1234567890"
              className="border rounded px-3 py-2 text-sm flex-1"
              required
            />
            <button
              type="submit"
              disabled={settingProfile}
              className="bg-violet-600 text-white px-4 py-2 rounded text-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {settingProfile ? "Linking..." : "Link"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-100 rounded px-4 py-2 mb-4 flex justify-between items-center text-sm">
          <span>
            Your number: <strong>{maskPhone(profile.phone_number)}</strong>
          </span>
          <div className="flex items-center gap-3">
            {schedules.some(s => s.always && s.uid === profile.uid) ? (
              <button
                onClick={async () => {
                  const entry = schedules.find(s => s.always && s.uid === profile.uid);
                  if (entry && window.confirm("Remove always on-call status?")) {
                    try {
                      await api.delete(`/api/schedules/${entry._id}`);
                      addNotification("Always on-call removed", "success", "on-call");
                      await loadSchedules();
                    } catch (error) {
                      addNotification(error.response?.data?.error || error.message, "error", "on-call");
                    }
                  }
                }}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300 hover:bg-green-200"
              >
                ✓ Always on-call
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await api.post("/api/schedules", { always: true });
                    addNotification("Marked as always on-call", "success", "on-call");
                    await loadSchedules();
                  } catch (error) {
                    addNotification(error.response?.data?.error || error.message, "error", "on-call");
                  }
                }}
                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
              >
                Always on-call
              </button>
            )}
            <button onClick={handleUnlinkProfile} className="text-neutral-100 hover:text-neutral-200 text-xs">
              Unlink
            </button>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
          className="px-3 py-1 bg-200 rounded hover:bg-300 text-lg"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold">{currentMonth.format("MMMM YYYY")}</h2>
        <button
          onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
          className="px-3 py-1 bg-200 rounded hover:bg-300 text-lg"
        >
          ›
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading schedules...</div>
      ) : (
        <div className="border border-gray-300 rounded overflow-hidden mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7">
            {DAYS.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-2 bg-violet-50 text-violet-700 border-b border-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, i) => {
              if (!date) {
                return (
                  <div key={`empty-${i}`} className="calendar-cell bg-gray-50 border-b border-r border-gray-200" />
                );
              }

              const dateStr = date.format("YYYY-MM-DD");
              const isToday = dateStr === today;
              const isPast = dateStr < today;
              const events = isPast
                ? getEventsForDate(date, schedules).filter(s => !s.always)
                : getEventsForDate(date, schedules);
              const isSelected = selectedDate && dateStr === selectedDate.format("YYYY-MM-DD");

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(date)}
                  className={`calendar-cell border-b border-r border-gray-200 transition-colors ${
                    isPast ? "bg-gray-100 opacity-60" : "cursor-pointer hover:bg-violet-50"
                  } ${isToday ? "bg-violet-100" : ""} ${isSelected ? "ring-2 ring-violet-500 ring-inset" : ""}`}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${isPast ? "text-gray-400" : isToday ? "text-violet-700 font-bold" : "text-gray-700"}`}
                  >
                    {date.date()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {events.slice(0, 3).map(evt => {
                      const color = getUserColor(evt.uid, uidList);
                      return (
                        <div
                          key={evt._id}
                          className={`text-[10px] leading-tight px-1 rounded truncate ${color.bg} ${color.text}`}
                          title={`${evt.always ? "Always on-call" : `${evt.start_time}–${evt.end_time}`} ${maskPhone(evt.phone_number)}${evt.recurring ? " (recurring)" : ""}${evt.always ? " (always)" : ""}`}
                        >
                          {evt.always ? "Always" : `${evt.start_time}–${evt.end_time}`}
                        </div>
                      );
                    })}
                    {events.length > 3 && <div className="text-[10px] text-gray-500">+{events.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showModal && selectedDate && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-1">{selectedDate.format("dddd, MMMM D, YYYY")}</h3>
              <p className="text-sm text-gray-500 mb-4">Add on-call time</p>

              {/* Existing events for this day */}
              {selectedDateEvents.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Scheduled</h4>
                  <div className="space-y-1">
                    {selectedDateEvents.map(evt => {
                      const color = getUserColor(evt.uid, uidList);
                      const isOwn = profile && evt.uid === profile.uid;

                      return (
                        <div
                          key={evt._id}
                          className={`flex items-center justify-between rounded px-3 py-2 text-sm border ${color.bg} ${color.text} ${color.border}`}
                        >
                          <span>
                            {evt.always ? "Always on-call" : `${evt.start_time} – ${evt.end_time}`}{" "}
                            <span className="text-xs opacity-70">
                              ({isOwn ? "You" : maskPhone(evt.phone_number)}){evt.recurring && " · recurring"}
                              {evt.always && " · always"}
                            </span>
                          </span>
                          {isOwn && (
                            <button
                              onClick={() => handleDeleteSchedule(evt._id)}
                              className="text-neutral-100 hover:text-neutral-200 text-xs font-medium ml-2"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add new event */}
              <form onSubmit={handleCreateSchedule}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={e => setRecurring(e.target.checked)}
                    className="w-4 h-4 text-violet-600"
                  />
                  <span className="text-sm text-gray-700">Repeat every {DAY_NAMES[selectedDate.day()]}</span>
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded text-sm text-neutral-200 hover:bg-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 text-white rounded text-sm hover:bg-violet-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};
