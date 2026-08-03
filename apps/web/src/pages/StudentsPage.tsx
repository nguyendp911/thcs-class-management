import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockUsers, mockGuardians } from '../lib/mockData';
import type { Student, User } from '../types';
import { generateUsername, removeVietnameseTones } from '../utils/accountUtils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
  Search, Eye, CheckCircle, Download, Upload, UserPlus, Camera, Image, FileSpreadsheet, Phone, MessageSquare, Target, MapPin, Trash2, FileDown, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';

  const { selectedClass, classesList, permittedClasses, studentsList: students, setStudentsList: saveStudentsList } = useAuth();
  const displayClasses = (permittedClasses && permittedClasses.length > 0) ? permittedClasses : classesList;
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [targetStudentForPhoto, setTargetStudentForPhoto] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Modals State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetStudentToDelete, setTargetStudentToDelete] = useState<Student | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // WebCam Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modals Contact & Support Plan
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactTargetStudent, setContactTargetStudent] = useState<Student | null>(null);
  const [contactNote, setContactNote] = useState('');

  const [isSupportPlanModalOpen, setIsSupportPlanModalOpen] = useState(false);
  const [supportPlanTargetStudent, setSupportPlanTargetStudent] = useState<Student | null>(null);
  const [supportGoal, setSupportGoal] = useState('');

  // Download Formatted Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'STT': 1,
        'Mã Học Sinh': 'HS8A1001',
        'Họ và Tên': 'Nguyễn Văn An',
        'Giới tính': 'Nam',
        'Ngày sinh': '2012-05-15',
        'Tổ': 'Tổ 1',
        'Địa chỉ': 'Số 12 Nguyễn Đăng Đạo, Phường Đại Phúc',
        'Họ tên Phụ huynh': 'Nguyễn Văn Thành',
        'Số điện thoại Phụ huynh': '0912345678',
      },
      {
        'STT': 2,
        'Mã Học Sinh': 'HS8A1002',
        'Họ và Tên': 'Trần Thị Bình',
        'Giới tính': 'Nữ',
        'Ngày sinh': '2012-08-20',
        'Tổ': 'Tổ 2',
        'Địa chỉ': 'Số 45 Trần Hưng Đạo, Thành phố Bắc Ninh',
        'Họ tên Phụ huynh': 'Trần Văn Bình',
        'Số điện thoại Phụ huynh': '0987654321',
      },
      {
        'STT': 3,
        'Mã Học Sinh': 'HS8A1003',
        'Họ và Tên': 'Lê Hoàng Cường',
        'Giới tính': 'Nam',
        'Ngày sinh': '2012-11-10',
        'Tổ': 'Tổ 3',
        'Địa chỉ': 'Số 88 Lý Thái Tổ, Thành phố Bắc Ninh',
        'Họ tên Phụ huynh': 'Lê Văn Cường',
        'Số điện thoại Phụ huynh': '0905123456',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 22 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 42 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Danh_Sach_Hoc_Sinh');
    XLSX.writeFile(workbook, `Mau_Excel_Nhap_Hoc_Sinh_${selectedClass.name || 'THCS'}.xlsx`);
    showToast('📥 Đã tải file mẫu Excel (.xlsx) chuẩn định dạng kèm 3 dòng dữ liệu ví dụ!');
  };

  // Single Student Delete Handler
  const handleOpenDeleteModal = (student: Student) => {
    setTargetStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteSingle = () => {
    if (!targetStudentToDelete) return;
    const updatedList = students.filter((s: Student) => s.id !== targetStudentToDelete.id);
    saveStudentsList(updatedList);
    setIsDeleteModalOpen(false);
    showToast(`🗑️ Đã xóa học sinh ${targetStudentToDelete.full_name} (${targetStudentToDelete.student_code}) khỏi hồ sơ lớp!`);
    setSelectedStudents(prev => prev.filter(id => id !== targetStudentToDelete.id));
    setTargetStudentToDelete(null);
  };

  // Bulk Delete Handler
  const handleConfirmBulkDelete = () => {
    if (selectedStudents.length === 0) return;
    const updatedList = students.filter((s: Student) => !selectedStudents.includes(s.id));
    saveStudentsList(updatedList);
    setIsBulkDeleteModalOpen(false);
    showToast(`🗑️ Đã xóa thành công ${selectedStudents.length} học sinh khỏi hồ sơ lớp!`);
    setSelectedStudents([]);
  };

  // New Student Form State
  const [newClassId, setNewClassId] = useState<number | string>(selectedClass?.id || 0);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newGender, setNewGender] = useState<'nam' | 'nữ'>('nam');
  const [newDob, setNewDob] = useState('2013-05-15');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newGroup, setNewGroup] = useState('Tổ 1');
  const [newAddress, setNewAddress] = useState('TP. Hồ Chí Minh');

  // Import File State
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importedExcelData, setImportedExcelData] = useState<Student[] | null>(null);

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson && rawJson.length > 0) {
          const getRowVal = (r: any, keys: string[]): string => {
            if (!r) return '';
            for (const k of keys) {
              if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') {
                return String(r[k]).trim();
              }
            }
            const rKeys = Object.keys(r);
            for (const k of keys) {
              const fk = rKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
              if (fk && r[fk] !== undefined && r[fk] !== null && String(r[fk]).trim() !== '') {
                return String(r[fk]).trim();
              }
            }
            return '';
          };

          const parsedStudents: Student[] = rawJson.map((row: any, idx: number) => {
            const rawFullName = getRowVal(row, ['Họ và Tên', 'Họ tên', 'Họ và tên', 'Tên học sinh', 'Tên HS', 'Học sinh', 'Full Name', 'Name', 'HỌ VÀ TÊN', 'HỌ TÊN']) || `Học sinh ${idx + 1}`;
            const fullName = rawFullName.trim() || `Học sinh ${idx + 1}`;
            const nameParts = fullName.split(' ').filter(Boolean);
            const firstName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : fullName;
            const lastName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';

            // Handle date of birth (serial date or Date or string)
            let dobStr = '2013-05-14';
            const rawDob = row['Ngày sinh'] || row['Ngày Sinh'] || row['DOB'] || row['NGÀY SINH'];
            if (rawDob instanceof Date) {
              dobStr = rawDob.toISOString().split('T')[0];
            } else if (typeof rawDob === 'number') {
              const dateObj = XLSX.SSF.parse_date_code(rawDob);
              if (dateObj) {
                dobStr = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
              }
            } else if (rawDob) {
              dobStr = rawDob.toString().trim();
            }

            const guardianName = getRowVal(row, ['Họ tên Phụ huynh', 'Họ tên PH', 'Phụ huynh', 'Họ tên cha', 'Họ tên mẹ', 'CHA MẸ']) || 'Nguyễn Văn Hùng';
            const guardianPhone = getRowVal(row, ['SĐT Phụ huynh', 'SĐT PH', 'Số điện thoại PH', 'SĐT', 'Điện thoại', 'Số điện thoại']) || '0901000001';
            const studentCode = getRowVal(row, ['Mã Học Sinh', 'Mã HS', 'Mã học sinh', 'Mã số', 'STT']) || `HS${String(idx + 1).padStart(3, '0')}`;
            const rawGender = getRowVal(row, ['Giới tính', 'Giới Tính', 'Phái', 'Nam/Nữ']);

            // Generate lowercase username for student & parent
            const hsUsername = generateUsername(fullName, 'hs');
            const phhsUsername = generateUsername(guardianName, 'phhs');

            // Save accounts into mockUsers
            mockUsers.push({
              id: Date.now() + idx,
              public_id: `USR-STU-${Date.now()}-${idx}`,
              name: fullName,
              email: `${hsUsername}@school.edu.vn`,
              username: hsUsername,
              role: 'standard_user',
              status: 'active',
              must_change_password: true,
              activation_request: { target_role: 'student', status: 'pending', requested_at: new Date().toLocaleString() },
            });

            mockUsers.push({
              id: Date.now() + 1000 + idx,
              public_id: `USR-PHHS-${Date.now()}-${idx}`,
              name: guardianName,
              email: `${phhsUsername}@school.edu.vn`,
              username: phhsUsername,
              role: 'standard_user',
              status: 'active',
              must_change_password: true,
              activation_request: { target_role: 'parent', status: 'pending', requested_at: new Date().toLocaleString() },
            });

            return {
              id: idx + 1,
              public_id: `HS-${String(idx + 1).padStart(3, '0')}`,
              student_code: studentCode,
              first_name: firstName || fullName || 'H',
              last_name: lastName || '',
              full_name: fullName || 'Học sinh',
              gender: rawGender.toLowerCase() === 'nữ' ? 'nữ' : 'nam',
              date_of_birth: dobStr,
              address: getRowVal(row, ['Địa chỉ', 'Hộ khẩu', 'Nơi ở']) || 'TP. Hồ Chí Minh',
              status: getRowVal(row, ['Trạng thái', 'Tình trạng']).toLowerCase() === 'bảo lưu' ? 'bảo lưu' : 'đang học',
              class_id: selectedClass?.id || 0,
              class_name: selectedClass?.name || 'Lớp học',
              group_name: getRowVal(row, ['Tổ', 'Tổ học tập']) || 'Tổ 1',
              roll_number: idx + 1,
              primary_guardian_name: guardianName,
              primary_guardian_phone: guardianPhone,
            };
          });

          setImportedExcelData(parsedStudents);
        }
      } catch (err) {
        console.error('Error parsing Excel file:', err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (importedExcelData && importedExcelData.length > 0) {
      const targetClass = (selectedClass && selectedClass.id !== 0) ? selectedClass : { id: 0, name: 'Lớp học' };
      const normalizedStudents = importedExcelData.map(s => ({
        ...s,
        class_id: targetClass.id,
        class_name: targetClass.name,
      }));

      saveStudentsList(normalizedStudents);
      setIsImportModalOpen(false);
      showToast(`🎉 ĐÃ NHẬP THÀNH CÔNG ${normalizedStudents.length} HỌC SINH TỪ FILE EXCEL! Tự động lưu bền vững vào MySQL & LocalStorage!`);
      setImportedExcelData(null);
      setImportFileName(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const cleanSearch = removeVietnameseTones((searchTerm || '').trim().toLowerCase());

    return (students || []).filter((s: Student) => {
      if (!s) return false;

      const fullNameNorm = removeVietnameseTones((s.full_name || '').toLowerCase());
      const codeNorm = removeVietnameseTones((s.student_code || s.public_id || '').toLowerCase());
      const phoneNorm = (s.primary_guardian_phone || '').toLowerCase();
      const guardianNorm = removeVietnameseTones((s.primary_guardian_name || '').toLowerCase());
      const addressNorm = removeVietnameseTones((s.address || '').toLowerCase());

      const matchSearch =
        !cleanSearch ||
        fullNameNorm.includes(cleanSearch) ||
        codeNorm.includes(cleanSearch) ||
        phoneNorm.includes(cleanSearch) ||
        guardianNorm.includes(cleanSearch) ||
        addressNorm.includes(cleanSearch);

      const matchGroup = selectedGroup === 'all' || s.group_name === selectedGroup;
      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;

      return matchSearch && matchGroup && matchStatus;
    });
  }, [students, searchTerm, selectedGroup, selectedStatus]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenPhotoModal = (student: Student) => {
    setTargetStudentForPhoto(student);
    setPhotoPreview(student.avatar_url || null);
    setIsCameraActive(false);
    setIsUploadPhotoModalOpen(true);
  };

  const handleStartCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showToast('Không thể bật camera thiết bị. Vui lòng cho phép truy cập webcam.');
    }
  };

  const handleCaptureFromCamera = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUrl);
        
        // Stop stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
      }
    }
  };

  const handleFileChangeForPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhotoToHostDb = async () => {
    if (!targetStudentForPhoto || !photoPreview) return;

    setIsSavingToDb(true);
    let finalUrl = photoPreview;

    try {
      // 1. Send API POST Request to save photo on Host Database (kjioxydi_thcs)
      const response = await fetch('/thcs/api/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetStudentForPhoto.id,
          student_code: targetStudentForPhoto.student_code,
          type: 'student',
          image: photoPreview,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.avatar_url) {
          finalUrl = resData.avatar_url;
        }
      }
    } catch (err) {
      console.warn('API error during upload:', err);
    }

    // Update Global State with clean server avatar URL
    saveStudentsList(students.map((s: any) => {
      if (s.id === targetStudentForPhoto.id) {
        return { ...s, avatar_url: finalUrl };
      }
      return s;
    }));

    setIsSavingToDb(false);
    setIsUploadPhotoModalOpen(false);
    showToast(`Đã lưu thành công ảnh hồ sơ em ${targetStudentForPhoto.full_name} vào Cơ sở dữ liệu Host (kjioxydi_thcs)!`);
  };

  const handleOpenContactModal = (student: Student) => {
    setContactTargetStudent(student);
    setIsContactModalOpen(true);
  };

  const handleSendContactMessage = () => {
    setIsContactModalOpen(false);
    showToast(`Đã gửi thông tin liên hệ tới phụ huynh em ${contactTargetStudent?.full_name} thành công!`);
  };

  const handleOpenSupportPlanModal = (student: Student) => {
    setSupportPlanTargetStudent(student);
    setIsSupportPlanModalOpen(true);
  };

  const handleSaveSupportPlan = () => {
    setIsSupportPlanModalOpen(false);
    showToast(`Đã khởi tạo Kế hoạch hỗ trợ cho học sinh ${supportPlanTargetStudent?.full_name}`);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;

    const fullName = `${newLastName} ${newFirstName}`;
    const generatedUsername = generateUsername(fullName, 'HS');

    const targetClass = classesList.find(c => String(c.id) === String(newClassId)) || selectedClass;

    const newStudent: Student = {
      id: students.length + 1,
      public_id: `STU-7A1-${(students.length + 1).toString().padStart(3, '0')}`,
      student_code: `HS2025${(students.length + 1).toString().padStart(3, '0')}`,
      first_name: newFirstName,
      last_name: newLastName,
      full_name: fullName,
      avatar_url: photoPreview || undefined,
      gender: newGender,
      date_of_birth: newDob,
      address: newAddress.trim() || 'TP. Hồ Chí Minh',
      status: 'đang học',
      class_id: targetClass?.id || selectedClass?.id || 0,
      class_name: targetClass?.name || selectedClass?.name || 'Lớp học',
      group_name: newGroup,
      roll_number: students.length + 1,
      primary_guardian_name: newGuardianName || 'Phụ huynh',
      primary_guardian_phone: newGuardianPhone || '0901234567',
    };

    // Auto-create standard_user account (Tài khoản thường)
    const newAccount: User = {
      id: Date.now(),
      public_id: `USR-STU-${Date.now()}`,
      name: fullName,
      email: `${generatedUsername.toLowerCase()}@school.edu.vn`,
      username: generatedUsername,
      role: 'standard_user',
      status: 'active',
      must_change_password: true,
      activation_request: {
        target_role: 'student',
        status: 'pending',
        requested_at: new Date().toLocaleString(),
      },
    };

    mockUsers.push(newAccount);

    saveStudentsList([newStudent, ...students]);
    setIsAddModalOpen(false);
    showToast(`🎉 Đã thêm ${fullName}! Tự động tạo tài khoản: ${generatedUsername} (Mật khẩu: 123456)`);

    setNewFirstName('');
    setNewLastName('');
    setPhotoPreview(null);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map((s, idx) => {
      const guardianInfo = mockGuardians.find(g => g.student_id === s.id);
      const parentName = s.primary_guardian_name || guardianInfo?.full_name || 'Nguyễn Văn Thành';
      const parentPhone = s.primary_guardian_phone || guardianInfo?.phone || '0988123456';
      const parentRel = guardianInfo?.relationship || 'Bố/Mẹ';
      const parentUsername = generateUsername(parentName, 'phhs');

      return {
        'STT': idx + 1,
        'Mã Học Sinh': s.student_code,
        'Căn cước/Mã ĐD': s.public_id,
        'Họ và Tên Học Sinh': s.full_name,
        'Giới tính': s.gender === 'nam' ? 'Nam' : 'Nữ',
        'Ngày sinh': s.date_of_birth,
        'Lớp học': s.class_name || selectedClass.name,
        'Tổ': s.group_name || 'Tổ 1',
        'Trạng thái': s.status,
        'Họ tên Phụ huynh': parentName,
        'Số điện thoại Phụ huynh': parentPhone,
        'Mối quan hệ Phụ huynh': parentRel,
        'Tài khoản PHHS tự tạo': parentUsername,
        'Mật khẩu PHHS mặc định': '123456',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hồ sơ Học Sinh');
    XLSX.writeFile(workbook, `Ho_So_Hoc_Sinh_${selectedClass.name}.xlsx`);
    showToast('🎉 Đã xuất file danh sách Excel đầy đủ thông tin Học Sinh & Phụ Huynh thành công!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#18243A] sm:text-3xl tracking-tight">
            Hồ sơ Học sinh {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Danh sách sĩ số {filteredStudents.length}/{selectedClass.student_count} học sinh, ảnh chân dung lưu Database và thông tin liên lạc phụ huynh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)} icon={<UserPlus className="h-4 w-4" />}>
            Thêm học sinh mới
          </Button>
          <Button size="sm" variant="mint" onClick={() => setIsImportModalOpen(true)} icon={<Upload className="h-4 w-4" />}>
            Nhập file Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadExcelTemplate} icon={<FileDown className="h-4 w-4 text-[#6C63FF]" />}>
            Tải file mẫu Excel (.xlsx)
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} icon={<Download className="h-4 w-4" />}>
            Xuất file Excel
          </Button>
          {selectedStudents.length > 0 && (
            <Button size="sm" variant="danger" onClick={() => setIsBulkDeleteModalOpen(true)} icon={<Trash2 className="h-4 w-4" />}>
              Xóa {selectedStudents.length} học sinh đã chọn
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="clay-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68758D]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              if (val.trim()) {
                setSearchParams({ search: val });
              } else {
                setSearchParams({});
              }
            }}
            placeholder="Tìm theo tên học sinh, mã HS hoặc SĐT phụ huynh..."
            className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] py-2 pl-10 pr-3 text-xs font-bold text-[#18243A] focus:border-[#6C63FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-[#E1E6F0] bg-white px-3 py-2 text-xs font-extrabold text-[#18243A]"
          >
            <option value="all">Tất cả các Tổ</option>
            <option value="Tổ 1">Tổ 1</option>
            <option value="Tổ 2">Tổ 2</option>
            <option value="Tổ 3">Tổ 3</option>
            <option value="Tổ 4">Tổ 4</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-[#E1E6F0] bg-white px-3 py-2 text-xs font-extrabold text-[#18243A]"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="đang học">Đang học</option>
            <option value="bảo lưu">Bảo lưu</option>
            <option value="chuyển lớp">Chuyển lớp</option>
          </select>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="clay-card p-6 overflow-x-auto">
        <table className="w-full text-left text-xs text-[#18243A]">
          <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  className="rounded border-[#E1E6F0] text-[#6C63FF]"
                />
              </th>
              <th className="p-3 w-16">Ảnh DB</th>
              <th className="p-3">Mã HS</th>
              <th className="p-3">Họ và tên</th>
              <th className="p-3">Giới tính</th>
              <th className="p-3">Tổ</th>
              <th className="p-3">Nơi ở hiện tại</th>
              <th className="p-3">Phụ huynh liên hệ</th>
              <th className="p-3 text-center">Thao tác Nhanh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E6F0]">
            {filteredStudents.map(s => (
              <tr key={s.id} className="hover:bg-[#FAFBFF]">
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => handleSelectOne(s.id)}
                    className="rounded border-[#E1E6F0] text-[#6C63FF]"
                  />
                </td>
                <td className="p-3">
                  <div className="relative group cursor-pointer" onClick={() => handleOpenPhotoModal(s)}>
                    <UserAvatar
                      name={s.full_name || s.first_name || 'Học sinh'}
                      avatarUrl={s.avatar_url}
                      role="student"
                      size="sm"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono font-bold text-[#68758D] cursor-pointer hover:text-[#6C63FF]" onClick={() => navigate(`/app/classes/${selectedClass?.id || 0}/students/${s.public_id}`)}>{s.student_code}</td>
                <td className="p-3 font-extrabold text-[#18243A] cursor-pointer hover:text-[#6C63FF]" onClick={() => navigate(`/app/classes/${selectedClass?.id || 0}/students/${s.public_id}`)}>{s.full_name}</td>
                <td className="p-3 font-bold capitalize">{s.gender}</td>
                <td className="p-3"><Badge variant="info">{s.group_name}</Badge></td>
                <td className="p-3 max-w-[180px] truncate" title={s.address || 'Chưa cập nhật'}>
                  <div className="font-semibold text-[#18243A] flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-[#6C63FF] shrink-0" />
                    <span className="truncate">{s.address || 'TP. Hồ Chí Minh'}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-bold text-[#18243A]">{s.primary_guardian_name}</div>
                  <div className="text-[10px] text-[#68758D] font-mono">{s.primary_guardian_phone}</div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenContactModal(s)}
                      title="Liên hệ phụ huynh"
                      className="p-1.5 rounded-lg text-[#22C997] hover:bg-[#E6F9F3]"
                    >
                      <Phone className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleOpenSupportPlanModal(s)}
                      title="Tạo kế hoạch hỗ trợ"
                      className="p-1.5 rounded-lg text-[#6C63FF] hover:bg-[#EEECFF]"
                    >
                      <Target className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleOpenPhotoModal(s)}
                      title="Cập nhật ảnh lưu Database"
                      className="p-1.5 rounded-lg text-[#18243A] hover:bg-[#FAFBFF]"
                    >
                      <Camera className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => navigate(`/app/classes/${selectedClass?.id || 0}/students/${s.public_id}`)}
                      title="Xem hồ sơ"
                      className="p-1.5 rounded-lg text-[#18243A] hover:bg-[#FAFBFF]"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleOpenDeleteModal(s)}
                      title="Xóa học sinh khỏi hồ sơ"
                      className="p-1.5 rounded-lg text-[#FF5D68] hover:bg-[#FFE5E7] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Upload Avatar Photo with WebCam & DB Save */}
      <Modal
        isOpen={isUploadPhotoModalOpen}
        onClose={() => setIsUploadPhotoModalOpen(false)}
        title={`Cập Nhật Ảnh Hồ Sơ (Lưu Database Host): ${targetStudentForPhoto?.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUploadPhotoModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSavePhotoToHostDb} isLoading={isSavingToDb} icon={<Upload className="h-4 w-4" />}>
              Lưu ảnh vào Cơ sở dữ liệu Host
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center space-y-4 py-2">
          {isCameraActive ? (
            <div className="relative flex flex-col items-center">
              <video ref={videoRef} autoPlay playsInline className="w-48 h-48 rounded-2xl object-cover border-4 border-[#6C63FF] shadow-lg"></video>
              <button
                onClick={handleCaptureFromCamera}
                className="mt-3 px-4 py-2 rounded-xl bg-[#22C997] text-white text-xs font-extrabold shadow-md hover:bg-[#1BB385]"
              >
                📸 Chụp ảnh ngay
              </button>
            </div>
          ) : photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-36 h-36 rounded-full object-cover border-4 border-[#6C63FF] shadow-lg" />
          ) : (
            <div className="w-36 h-36 rounded-full bg-[#EEECFF] border-2 border-dashed border-[#6C63FF] flex flex-col items-center justify-center text-[#6C63FF]">
              <Image className="h-10 w-10 mb-1" />
              <span className="text-[10px] font-extrabold">Chưa có ảnh</span>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden"></canvas>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-extrabold cursor-pointer hover:bg-[#5148E5] transition-colors shadow-sm">
              <Upload className="h-4 w-4" /> Tải tệp từ máy tính
              <input type="file" accept="image/*" onChange={handleFileChangeForPhoto} className="hidden" />
            </label>

            <button
              onClick={handleStartCamera}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#22C997] text-white text-xs font-extrabold hover:bg-[#1BB385] transition-colors shadow-sm"
            >
              <Camera className="h-4 w-4" /> Bật Camera Chụp Trực Tiếp
            </button>
          </div>
          <p className="text-[10px] text-[#68758D] font-bold">Ảnh chụp/tải lên sẽ tự động mã hóa và lưu vào bảng `students` / `users` trên Database Host `kjioxydi_thcs`</p>
        </div>
      </Modal>

      {/* Modal Contact Guardian */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Liên Hệ Phụ Huynh Học Sinh: ${contactTargetStudent?.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSendContactMessage} icon={<MessageSquare className="h-4 w-4" />}>
              Gửi tin nhắn liên hệ
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-[#FAFBFF] rounded-xl border border-[#E1E6F0] text-xs space-y-1">
            <div><span className="text-[#68758D] font-bold">Họ tên Phụ huynh:</span> <strong className="text-[#18243A]">{contactTargetStudent?.primary_guardian_name}</strong></div>
            <div><span className="text-[#68758D] font-bold">Số điện thoại:</span> <strong className="text-[#6C63FF] font-mono">{contactTargetStudent?.primary_guardian_phone}</strong></div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nội dung cuộc trao đổi / Tin nhắn:</label>
            <textarea
              rows={3}
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="Nhập nội dung cần trao đổi trực tiếp với phụ huynh..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Create Support Plan */}
      <Modal
        isOpen={isSupportPlanModalOpen}
        onClose={() => setIsSupportPlanModalOpen(false)}
        title={`Tạo Kế Hoạch Hỗ Trợ: ${supportPlanTargetStudent?.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSupportPlanModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveSupportPlan} icon={<Target className="h-4 w-4" />}>
              Khởi tạo kế hoạch
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mục tiêu hỗ trợ (Học tập / Rèn luyện):</label>
            <input
              type="text"
              required
              value={supportGoal}
              onChange={(e) => setSupportGoal(e.target.value)}
              placeholder="VD: Phụ đạo kiến thức Toán đại số tiết 4"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Import Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập Danh Sách Học Sinh Từ File Excel"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmImport} disabled={!importedExcelData || importedExcelData.length === 0} icon={<Upload className="h-4 w-4" />}>
              Xác Nhận Nhập {importedExcelData ? `(${importedExcelData.length} Học Sinh)` : 'Dữ Liệu'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="border-2 border-dashed border-[#E1E6F0] rounded-2xl p-6 text-center bg-[#FAFBFF]">
            <FileSpreadsheet className="h-12 w-12 text-[#6C63FF] mx-auto mb-2" />
            <div className="text-xs font-extrabold text-[#18243A]">Tải lên file Excel danh sách (.xlsx, .xls)</div>
            <p className="text-[10px] text-[#68758D] font-bold mt-1 mb-3">Hỗ trợ tự động nhận diện cột: Mã Học Sinh, Họ và Tên, Giới tính, Ngày sinh, Họ tên Phụ huynh, SĐT</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EEECFF] text-[#6C63FF] text-xs font-extrabold cursor-pointer hover:bg-[#E2DFFF] border border-[#C0BBFD]">
                Chọn tệp dữ liệu Excel
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelFileChange} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0FDF4] text-[#16A34A] text-xs font-extrabold hover:bg-[#DCFCE7] border border-[#86EFAC] transition-colors"
              >
                <FileDown className="h-4 w-4" /> Tải tệp Excel mẫu (.xlsx)
              </button>
            </div>

            {importFileName && (
              <div className="mt-3 text-xs font-extrabold text-[#22C997]">
                ✓ Đã tải file: {importFileName} {importedExcelData && `(${importedExcelData.length} học sinh sẵn sàng nhập)`}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Add Student */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Học Sinh Mới Vô Lớp"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button onClick={handleAddStudent} icon={<UserPlus className="h-4 w-4" />}>Thêm học sinh</Button>
          </>
        }
      >
        <form onSubmit={handleAddStudent} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Lớp học tiếp nhận học sinh:</label>
            <select
              value={newClassId || selectedClass?.id || 0}
              onChange={(e) => setNewClassId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#C0BBFD] bg-[#EEECFF] p-2.5 text-xs font-extrabold text-[#6C63FF] focus:outline-none cursor-pointer"
            >
              {displayClasses && displayClasses.length > 0 ? (
                displayClasses.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade_level} - Phòng {cls.room})
                  </option>
                ))
              ) : (
                <option value={selectedClass?.id || 0}>{selectedClass?.name || 'Lớp học hiện tại'}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Họ & Đệm:</label>
              <input
                type="text"
                required
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="VD: Nguyễn Văn"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tên học sinh:</label>
              <input
                type="text"
                required
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="VD: Hòa"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Giới tính:</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'nam' | 'nữ')}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
              >
                <option value="nam">Nam</option>
                <option value="nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Ngày sinh:</label>
              <input
                type="date"
                value={newDob}
                onChange={(e) => setNewDob(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tổ học tập:</label>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
              >
                <option value="Tổ 1">Tổ 1</option>
                <option value="Tổ 2">Tổ 2</option>
                <option value="Tổ 3">Tổ 3</option>
                <option value="Tổ 4">Tổ 4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nơi ở hiện tại / Địa chỉ liên hệ:</label>
            <input
              type="text"
              required
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="VD: Số 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ tên Phụ huynh:</label>
            <input
              type="text"
              value={newGuardianName}
              onChange={(e) => setNewGuardianName(e.target.value)}
              placeholder="VD: Nguyễn Văn Thành"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Số điện thoại Phụ huynh:</label>
            <input
              type="text"
              value={newGuardianPhone}
              onChange={(e) => setNewGuardianPhone(e.target.value)}
              placeholder="VD: 0901234567"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Single Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác Nhận Xóa Học Sinh Nhập Sai Hồ Sơ"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy bỏ</Button>
            <Button variant="danger" onClick={handleConfirmDeleteSingle} icon={<Trash2 className="h-4 w-4" />}>
              Xóa Học Sinh
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-3 py-3">
          <div className="w-12 h-12 rounded-full bg-[#FFE5E7] text-[#FF5D68] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#18243A]">
              Bạn có chắc chắn muốn xóa học sinh <span className="text-[#FF5D68]">{targetStudentToDelete?.full_name}</span>?
            </h3>
            <p className="text-xs text-[#68758D] font-bold mt-1">
              Mã học sinh: <code className="font-mono text-[#18243A] bg-[#FAFBFF] px-1.5 py-0.5 rounded border">{targetStudentToDelete?.student_code}</code> | Lớp: {targetStudentToDelete?.class_name || selectedClass.name}
            </p>
          </div>
          <p className="text-[11px] text-[#FF5D68] bg-[#FFF0F1] p-2.5 rounded-xl border border-[#FFC1C5] font-bold">
            ⚠️ Thao tác này sẽ xóa hồ sơ học sinh ra khỏi cơ sở dữ liệu và tự động cập nhật sĩ số lớp học!
          </p>
        </div>
      </Modal>

      {/* Modal Bulk Delete Confirmation */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title={`Xác Nhận Xóa Hàng Loạt (${selectedStudents.length} Học Sinh)`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)}>Hủy bỏ</Button>
            <Button variant="danger" onClick={handleConfirmBulkDelete} icon={<Trash2 className="h-4 w-4" />}>
              Xóa {selectedStudents.length} Học Sinh Đã Chọn
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-3 py-3">
          <div className="w-12 h-12 rounded-full bg-[#FFE5E7] text-[#FF5D68] flex items-center justify-center">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#18243A]">
              Xác nhận xóa <span className="text-[#FF5D68]">{selectedStudents.length} học sinh</span> đã chọn?
            </h3>
            <p className="text-xs text-[#68758D] font-bold mt-1">
              Các học sinh này sẽ bị xóa hoàn toàn khỏi danh sách lớp {selectedClass.name}.
            </p>
          </div>
          <p className="text-[11px] text-[#FF5D68] bg-[#FFF0F1] p-2.5 rounded-xl border border-[#FFC1C5] font-bold">
            ⚠️ Hành động xóa hàng loạt không thể hoàn tác. Sĩ số lớp sẽ tự động giảm từ {filteredStudents.length} xuống {filteredStudents.length - selectedStudents.length}.
          </p>
        </div>
      </Modal>
    </div>
  );
};
