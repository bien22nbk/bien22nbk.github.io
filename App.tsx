import React, { useState, useEffect } from 'react';
import { generateWeeklyReport } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { ReportPreview } from './components/ReportPreview';
import { MonthlyEvaluationView } from './components/MonthlyEvaluationView';
import { WeeklyReport, FileData } from './types';
import { 
  Download, 
  Loader2, 
  Sparkles, 
  ClipboardList, 
  History, 
  Trash2, 
  CalendarDays, 
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  X,
  Check
} from 'lucide-react';

const HISTORY_KEY = 'report_history';

type TabType = 'weekly' | 'monthly' | 'rules';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('monthly'); // default to monthly as requested, or user can toggle
  const [week, setWeek] = useState<number>(1);
  const [group, setGroup] = useState<string>('Tổ 1');
  const [notes, setNotes] = useState<string>('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WeeklyReport[]>([]);

  // Deletion modal state & toast notification for weekly history
  const [deleteWeeklyModal, setDeleteWeeklyModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    index?: number;
    title?: string;
  }>({ isOpen: false, type: 'all' });
  const [weeklyNotification, setWeeklyNotification] = useState<string | null>(null);

  useEffect(() => {
    if (weeklyNotification) {
      const timer = setTimeout(() => setWeeklyNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [weeklyNotification]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (newReport: WeeklyReport) => {
    const updatedHistory = [newReport, ...history].slice(0, 15);
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const confirmDeleteWeekly = () => {
    if (deleteWeeklyModal.type === 'all') {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
      setWeeklyNotification('Đã xóa toàn bộ lịch sử báo cáo tuần.');
    } else if (deleteWeeklyModal.type === 'single' && typeof deleteWeeklyModal.index === 'number') {
      const updated = history.filter((_, idx) => idx !== deleteWeeklyModal.index);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      const title = deleteWeeklyModal.title ? `"${deleteWeeklyModal.title}"` : 'Báo cáo';
      setWeeklyNotification(`Đã xóa ${title} khỏi lịch sử.`);
    }
    setDeleteWeeklyModal({ isOpen: false, type: 'all' });
  };

  const loadFromHistory = (item: WeeklyReport) => {
    setReport(item);
    setWeek(item.week);
    setGroup(item.group);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!notes && files.length === 0) {
      setError("Vui lòng nhập ghi chú hoặc tải lên ảnh sổ/file PDF.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await generateWeeklyReport(week, group, notes, files);
      setReport(data);
      saveToHistory(data);
    } catch (err: any) {
      const errorMessage = err?.message || "Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    if (!report) return;

    const chartRows = (report.students || []).map(s => {
      const maxScale = 110;
      const prevWidth = Math.max(1, Math.min((s.previousScore / maxScale) * 100, 100));
      const currWidth = Math.max(1, Math.min((s.score / maxScale) * 100, 100));
      const currColor = s.score >= s.previousScore ? '#2563eb' : '#dc2626'; 

      return `
        <tr>
          <td style="border: 0; padding: 4px 0; width: 25%; vertical-align: middle; font-size: 11px; border-bottom: 1px dashed #eee;">
            <strong>${s.name}</strong>
          </td>
          <td style="border: 0; padding: 4px 0; width: 75%; vertical-align: middle; border-bottom: 1px dashed #eee;">
            <div style="margin-bottom: 2px; white-space: nowrap;">
               <span style="display:inline-block; background-color: #9ca3af; height: 10px; width: ${prevWidth}%;"></span>
               <span style="font-size: 9px; color: #666; margin-left: 4px;">${s.previousScore} (Tuần trước)</span>
            </div>
            <div style="white-space: nowrap;">
               <span style="display:inline-block; background-color: ${currColor}; height: 10px; width: ${currWidth}%;"></span>
               <span style="font-size: 9px; font-weight:bold; margin-left: 4px;">${s.score} (Tuần này)</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const chartHtml = `
      <div style="margin: 20px 0; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid;">
        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">
          Biểu đồ theo dõi tiến bộ
        </h3>
        <p style="font-size: 10px; margin-bottom: 15px;">
          <span style="display:inline-block; width: 10px; height: 10px; background-color: #9ca3af; margin-right: 5px;"></span>Tuần trước
          &nbsp;&nbsp;
          <span style="display:inline-block; width: 10px; height: 10px; background-color: #2563eb; margin-right: 5px;"></span>Tuần này (Tiến bộ/Giữ vững)
          &nbsp;&nbsp;
          <span style="display:inline-block; width: 10px; height: 10px; background-color: #dc2626; margin-right: 5px;"></span>Tuần này (Sụt giảm)
        </p>
        <table style="width: 100%; border-collapse: collapse; border: 0;">
          ${chartRows}
        </table>
      </div>
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Báo cáo tuần ${report.week}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 14px; }
      table.data-table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      table.data-table th, table.data-table td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; }
      table.data-table th { background-color: #f2f2f2; font-weight: bold; }
      .header { text-align: center; margin-bottom: 20px; }
      .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
      .summary { margin: 15px 0; font-style: italic; }
      .score-col { width: 8%; text-align: center; font-weight: bold; }
      .rank-col { width: 10%; text-align: center; }
    </style>
    </head><body>`;

    const bodyContent = `
    <div class="header">
      <p class="title">BÁO CÁO TỔNG HỢP THI ĐUA - TUẦN ${report.week}</p>
      <p>Đơn vị: ${report.group}</p>
    </div>
    
    <div class="summary">
      <strong>Nhận xét chung:</strong> ${report.summary}
    </div>

    ${chartHtml}

    <br/>
    <h3>CHI TIẾT THI ĐUA</h3>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%">STT</th>
          <th style="width: 15%">Họ và tên</th>
          <th class="score-col">Điểm<br/>(Tuần trước)</th>
          <th class="score-col">Điểm<br/>(Tuần này)</th>
          <th class="rank-col">Xếp loại</th>
          <th style="width: 20%">Nền nếp</th>
          <th style="width: 20%">Học tập</th>
          <th style="width: 15%">Nhắn phụ huynh</th>
        </tr>
      </thead>
      <tbody>
        ${(report.students || []).map((s, index) => `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td style="text-align: center; color: #666;">${s.previousScore}</td>
            <td style="text-align: center;"><strong>${s.score}</strong></td>
            <td style="text-align: center;">${s.classification}</td>
            <td>${s.discipline}<br/>${s.hygiene ? `<i>(VS: ${s.hygiene})</i>` : ''}</td>
            <td>${s.learning}</td>
            <td>${s.parentNote}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <br/>
    <p style="text-align: right;"><i>Ngày......tháng......năm......</i></p>
    <p style="text-align: right;"><strong>Người lập báo cáo</strong></p>
    </body></html>`;

    const blob = new Blob([header + bodyContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Tuan_${report.week}_${report.group.replace(/\s/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Bar Contract (3 zones: Brand, 3 Nav Links, 1 Action) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Sổ Thi Đua 4.0</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-normal">Trợ lý Giáo viên & Cán bộ lớp</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Workspace Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'monthly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Tổng Kết Tháng (PDF)</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-md">
                Mới
              </span>
            </button>

            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'weekly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>Đánh Giá Tuần</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'rules'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Quy Định Thi Đua</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action / Mode Info */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>AI Thi Đua 4.0 Sẵn sàng</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: MONTHLY REPORT (NEW REQUESTED MENU) */}
        {activeTab === 'monthly' && (
          <MonthlyEvaluationView />
        )}

        {/* TAB 2: WEEKLY REPORT */}
        {activeTab === 'weekly' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Thông tin tuần học
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tuần học</label>
                    <input
                      type="number"
                      min="1"
                      value={week}
                      onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                      className="w-full text-sm rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị</label>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      className="w-full text-sm rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border p-2 bg-white"
                    >
                      <option>Cả lớp</option>
                      <option>Tổ 1</option>
                      <option>Tổ 2</option>
                      <option>Tổ 3</option>
                      <option>Tổ 4</option>
                      <option>Tổ 5</option>
                      <option>Tổ 6</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú nhanh (Copy từ Zalo/Messenger/Sổ tay)
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A đi học muộn sáng thứ 2. Trần Thị B không làm bài tập Toán. Tổ trưởng theo dõi đầy đủ..."
                    className="w-full rounded-lg border-slate-300 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border p-2 text-xs bg-white"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Ảnh Sổ Theo Dõi / Sổ Đầu Bài / File PDF tuần
                  </label>
                  <FileUploader
                    files={files}
                    onFilesSelected={setFiles}
                    onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang phân tích thi đua tuần...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Tạo Báo Cáo Tuần Bằng AI</span>
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
              </div>

              {/* History Section */}
              {history.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-600" />
                      Lịch sử báo cáo tuần ({history.length})
                    </h2>
                    <button 
                      type="button"
                      onClick={() => setDeleteWeeklyModal({ isOpen: true, type: 'all' })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200/60"
                      title="Xóa toàn bộ lịch sử tuần"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa tất cả</span>
                    </button>
                  </div>

                  {weeklyNotification && (
                    <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{weeklyNotification}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWeeklyNotification(null)}
                        className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {history.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => loadFromHistory(item)}
                        className={`group relative p-3 border rounded-lg cursor-pointer transition-all ${
                          report === item ? 'border-blue-400 bg-blue-50/50 shadow-2xs' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className={`font-semibold text-xs ${report === item ? 'text-blue-700' : 'text-slate-800'}`}>
                              Tuần {item.week}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{item.group}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Xem lại
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteWeeklyModal({
                                  isOpen: true,
                                  type: 'single',
                                  index: idx,
                                  title: `Tuần ${item.week} (${item.group})`
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Xóa báo cáo này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {item.students?.length || 0} học sinh
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification when weekly history is empty */}
              {history.length === 0 && weeklyNotification && (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{weeklyNotification}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeeklyNotification(null)}
                    className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Result Section */}
            <div className="lg:col-span-2">
              {!report ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed p-12 min-h-[460px]">
                  <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-base font-semibold text-slate-700">Chưa có dữ liệu báo cáo tuần</p>
                  <p className="text-xs text-slate-500 mt-1">Nhập ghi chú hoặc tải lên ảnh/PDF và bấm "Tạo Báo Cáo Tuần" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleDownloadWord}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-xs transition-colors text-xs font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Tải về file Word (.doc)
                    </button>
                  </div>
                  <ReportPreview report={report} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CLASS RULES (GUIDELINES REFERENCE) */}
        {activeTab === 'rules' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quy Định Chấm Điểm Thi Đua Lớp Học</h2>
                  <p className="text-xs text-slate-500">Tiêu chuẩn chấm điểm nền nếp & học tập áp dụng cho Tổ trưởng, Lớp trưởng và GVCN</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rules Section: Minus Points */}
                <div className="space-y-4">
                  <div className="p-4 bg-red-50/70 border border-red-100 rounded-xl">
                    <h3 className="font-bold text-red-900 text-sm flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      1. Thời Gian & Chuyên Cần
                    </h3>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      <li>Nghỉ học không phép / không chính đáng: <strong className="text-red-700">-2đ</strong></li>
                      <li>Đi học muộn: <strong className="text-red-700">-2đ</strong></li>
                      <li>Trống vào chưa về vị trí / mất trật tự: <strong className="text-red-700">-2đ</strong></li>
                      <li>Không xếp hàng / xếp hàng muộn: <strong className="text-red-700">-2đ</strong></li>
                      <li>Không tham gia lao động: <strong className="text-red-700">-5đ</strong> (lao động muộn: -3đ)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
                    <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      2. Nề Nếp & Kỷ Luật
                    </h3>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      <li>Sai đồng phục / thiếu khăn quàng: <strong className="text-amber-800">-2đ</strong></li>
                      <li>Không sơ vin / để xe lộn xộn: <strong className="text-amber-800">-2đ</strong></li>
                      <li>Vi phạm tóc tai / son móng tay: <strong className="text-amber-800">-2đ</strong></li>
                      <li>Vứt rác bừa bãi / vẽ bậy: <strong className="text-amber-800">-3đ</strong></li>
                      <li>Sử dụng điện thoại trái phép: <strong className="text-amber-800">-5đ</strong></li>
                      <li>Nói tục, vô lễ với thầy cô/bạn bè: <strong className="text-amber-800">-10đ</strong></li>
                    </ul>
                  </div>
                </div>

                {/* Rules Section: Learning & Plus Points */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      3. Học Tập (Sổ Đầu Bài)
                    </h3>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      <li>Bị thầy cô nhắc nhở / nói chuyện riêng: <strong className="text-blue-800">-2đ</strong></li>
                      <li>Không làm bài tập / chép bài bạn: <strong className="text-blue-800">-5đ</strong></li>
                      <li>Không thuộc bài / thiếu đồ dùng học tập: <strong className="text-blue-800">-3đ đến -5đ</strong></li>
                      <li>Điểm kiểm tra kém: Điểm 4 (-1đ), 3 (-2đ), 2 (-3đ), 1 (-4đ), 0 (-5đ)</li>
                      <li>Gian lận quy chế thi (quay cóp): <strong className="text-red-700">-15đ</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      4. Điểm Cộng & Khen Thưởng
                    </h3>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      <li>Kiểm tra miệng/15p: 8đ (<strong className="text-emerald-700">+1đ</strong>), 9đ (<strong className="text-emerald-700">+3đ</strong>), 10đ (<strong className="text-emerald-700">+5đ</strong>)</li>
                      <li>Kiểm tra giữa kì: 8-9đ (<strong className="text-emerald-700">+3đ</strong>), 10đ (<strong className="text-emerald-700">+5đ</strong>)</li>
                      <li>Xung phong phát biểu xây dựng bài: <strong className="text-emerald-700">+2đ/lần</strong></li>
                      <li>Tham gia phong trào tập thể tích cực: <strong className="text-emerald-700">+5đ</strong></li>
                      <li>Việc tốt (nhặt của rơi trả lại, quyên góp): <strong className="text-emerald-700">+10đ</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Classification rules */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Tiêu chuẩn Xếp Loại Thi Đua
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-purple-700 block">Xuất sắc</span>
                    <span className="text-slate-600 text-[11px]">&ge; 100 điểm & không bị trừ lỗi</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-emerald-700 block">Tốt</span>
                    <span className="text-slate-600 text-[11px]">&ge; 85 đến dưới 100 điểm</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-blue-700 block">Khá</span>
                    <span className="text-slate-600 text-[11px]">70 đến dưới 85 điểm</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="font-bold text-amber-700 block">Cần cố gắng</span>
                    <span className="text-slate-600 text-[11px]">Dưới 70 điểm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal xác nhận xóa lịch sử tuần */}
      {deleteWeeklyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  {deleteWeeklyModal.type === 'all'
                    ? 'Xóa toàn bộ lịch sử tuần?'
                    : 'Xóa báo cáo tuần khỏi lịch sử?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {deleteWeeklyModal.type === 'all'
                    ? `Bạn có chắc chắn muốn xóa toàn bộ ${history.length} báo cáo tuần đã lưu? Thao tác này không thể hoàn tác.`
                    : `Bạn có chắc muốn xóa ${deleteWeeklyModal.title ? `"${deleteWeeklyModal.title}"` : 'báo cáo này'} khỏi danh sách lịch sử?`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteWeeklyModal({ isOpen: false, type: 'all' })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeleteWeeklyModal({ isOpen: false, type: 'all' })}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteWeekly}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteWeeklyModal.type === 'all' ? 'Xác nhận xóa tất cả' : 'Xóa báo cáo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;