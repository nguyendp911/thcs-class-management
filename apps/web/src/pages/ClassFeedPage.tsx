import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RoleBadge } from '../components/ui/RoleBadge';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
  Heart, MessageCircle, Share2, Send, Sparkles, CheckCircle, Trophy, MessageSquare, Lock, Unlock, ShieldAlert,
  Calculator, FlaskConical, Zap
} from 'lucide-react';

interface FeedComment {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface FeedPost {
  id: number;
  author_name: string;
  author_role: string;
  category: string;
  content: string;
  image_urls?: string[];
  likes_count: number;
  created_at: string;
  is_liked?: boolean;
  comments: FeedComment[];
}

interface ChatMessage {
  id: number;
  author_name: string;
  author_role: string;
  avatar_letter: string;
  content: string;
  created_at: string;
  is_me?: boolean;
}

export const ClassFeedPage: React.FC = () => {
  const { currentUser, currentRole, selectedClass, studentsList } = useAuth();

  // Dynamic Top Active Student of the Week
  const topConductStudent = (() => {
    try {
      const cached = localStorage.getItem('thcs_conduct_events');
      if (cached) {
        const events = JSON.parse(cached);
        if (Array.isArray(events) && events.length > 0 && studentsList.length > 0) {
          const scoreMap: Record<number, number> = {};
          events.forEach((ev: any) => {
            if (ev.points > 0 && ev.student_id) {
              scoreMap[ev.student_id] = (scoreMap[ev.student_id] || 0) + ev.points;
            }
          });
          let bestId = -1;
          let maxScore = 0;
          Object.entries(scoreMap).forEach(([idStr, score]) => {
            if (score > maxScore) {
              maxScore = score;
              bestId = Number(idStr);
            }
          });
          if (bestId !== -1) {
            const st = studentsList.find(s => s.id === bestId);
            if (st) return { student: st, score: maxScore };
          }
        }
      }
    } catch (e) {}
    return null;
  })();
  
  // Subtab navigation: 'timeline' | 'chatroom'
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'chatroom'>('timeline');

  // Timeline Post State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('📌 Thông Báo');
  const [attachedImageUrls, setAttachedImageUrls] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // STEM Toolset Drawer State ('none' | 'math' | 'chem' | 'physics')
  const [stemToolMode, setStemToolMode] = useState<'none' | 'math' | 'chem' | 'physics'>('none');

  // Math Quadratic Calculator Inputs
  const [mathA, setMathA] = useState<number | string>(1);
  const [mathB, setMathB] = useState<number | string>(-5);
  const [mathC, setMathC] = useState<number | string>(6);

  // Chem Molar Mass Calculator Input
  const [chemFormula, setChemFormula] = useState('H2SO4');

  // Chatroom State & Lock Toggle
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('thcs_chatroom_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('thcs_chatroom_messages');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });

  const [newChatMessage, setNewChatMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<string, string> = {
    superadmin: 'SuperAdmin',
    homeroom_teacher: 'GV Chủ Nhiệm',
    subject_teacher: 'GV Bộ môn',
    admin: 'System Admin',
    parent: 'Phụ huynh',
    student: 'Học sinh',
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };



  // Load feed posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      const cached = localStorage.getItem('thcs_class_posts');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setPosts(parsed);
          }
        } catch (e) {}
      }

      try {
        const res = await fetch('/thcs/api/posts');
        if (res.ok) {
          const data = await res.json();
          if (data.posts && Array.isArray(data.posts)) {
            const mapped = data.posts.map((p: any) => ({
              ...p,
              image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
              comments: p.comments || [],
            }));
            setPosts(mapped);
            localStorage.setItem('thcs_class_posts', JSON.stringify(mapped));
          }
        }
      } catch (err) {}
    };

    loadPosts();
  }, []);

  // Scroll Chat to bottom when switching to chatroom tab or sending new message
  useEffect(() => {
    if (activeSubTab === 'chatroom') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSubTab, chatMessages]);

  const savePostsState = (updated: FeedPost[]) => {
    setPosts(updated);
    localStorage.setItem('thcs_class_posts', JSON.stringify(updated));
  };

  const saveChatMessages = (updated: ChatMessage[]) => {
    setChatMessages(updated);
    localStorage.setItem('thcs_chatroom_messages', JSON.stringify(updated));
  };

  // Toggle Chatroom Lock (SuperAdmin, Admin, GVCN ONLY)
  const handleToggleChatroomLock = () => {
    const nextState = !isChatEnabled;
    setIsChatEnabled(nextState);
    localStorage.setItem('thcs_chatroom_enabled', String(nextState));
    showToast(nextState ? '🟢 ĐÃ BẬT PHÒNG CHAT LỚP! Học sinh & Phụ huynh có thể trò chuyện.' : '🔒 ĐÃ KHÓA PHÒNG CHAT LỚP! Tạm thời ngừng nhận tin nhắn mới.');
  };

  // Handle Multi-Image File Selection
  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readPromises: Promise<string>[] = Array.from(files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(newUrls => {
      setAttachedImageUrls(prev => [...prev, ...newUrls]);
      showToast(`Đã đính kèm ${newUrls.length} ảnh mới!`);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachedImage = (indexToRemove: number) => {
    setAttachedImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit New Timeline Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: FeedPost = {
      id: Date.now(),
      author_name: currentUser.name.replace(/\s*\([^)]*\)/g, ''),
      author_role: roleLabels[currentRole] || 'Thành viên',
      category: newPostCategory,
      content: newPostContent,
      image_urls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
      likes_count: 0,
      created_at: 'Vừa xong',
      comments: [],
    };

    const updated = [newPost, ...posts];
    savePostsState(updated);

    try {
      await fetch('/thcs/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass?.id || 0,
          author_name: newPost.author_name,
          author_role: newPost.author_role,
          category: newPost.category,
          content: newPost.content,
          image_urls: newPost.image_urls,
        }),
      });
    } catch (err) {}

    setNewPostContent('');
    setAttachedImageUrls([]);
    showToast('🎉 Đã đăng bài viết mới thành công lên Bảng Tin!');
  };

  // Send New Chat Message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !isChatEnabled) return;

    const authorCleanName = currentUser.name.replace(/\s*\([^)]*\)/g, '');
    const newMsg: ChatMessage = {
      id: Date.now(),
      author_name: authorCleanName,
      author_role: roleLabels[currentRole] || 'Thành viên',
      avatar_letter: (authorCleanName || 'U').charAt(0),
      content: newChatMessage.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_me: true,
    };

    const updated = [...chatMessages, newMsg];
    saveChatMessages(updated);
    setNewChatMessage('');
  };

  const handleInsertTextToChat = (text: string) => {
    setNewChatMessage(prev => (prev ? `${prev} ${text}` : text));
  };

  const handleSendEmoji = (emoji: string) => {
    if (!isChatEnabled) return;
    setNewChatMessage(prev => prev + emoji);
  };

  // Calculate Quadratic Solver Result for Math Tool
  const handleSolveQuadratic = () => {
    const a = Number(mathA);
    const b = Number(mathB);
    const c = Number(mathC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) return;
    if (a === 0) {
      handleInsertTextToChat(`📐 Giải pt bậc 1: ${b}x + ${c} = 0 → x = ${(-c / b).toFixed(2)}`);
      return;
    }

    const delta = b * b - 4 * a * c;
    if (delta < 0) {
      handleInsertTextToChat(`📐 PT ${a}x² + (${b})x + (${c}) = 0: Δ = ${delta} < 0 → Phương trình vô nghiệm`);
    } else if (delta === 0) {
      const x = -b / (2 * a);
      handleInsertTextToChat(`📐 PT ${a}x² + (${b})x + (${c}) = 0: Δ = 0 → Nghệ kép x₁ = x₂ = ${x.toFixed(2)}`);
    } else {
      const x1 = (-b + Math.sqrt(delta)) / (2 * a);
      const x2 = (-b - Math.sqrt(delta)) / (2 * a);
      handleInsertTextToChat(`📐 PT ${a}x² + (${b})x + (${c}) = 0: Δ = ${delta} > 0 → Hai nghiệm x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`);
    }
  };

  // Calculate Chemistry Molar Mass M
  const handleCalculateChemMolar = () => {
    const table: Record<string, number> = {
      'H2O': 18, 'CO2': 44, 'H2SO4': 98, 'HCL': 36.5, 'NAOH': 40, 'NACL': 58.5,
      'CACO3': 100, 'FE2O3': 160, 'AL2(SO4)3': 342, 'O2': 32, 'H2': 2, 'FE': 56, 'CU': 64, 'CA(OH)2': 74
    };

    const key = chemFormula.trim().toUpperCase();
    const m = table[key] || 100;
    handleInsertTextToChat(`🧪 Công thức Hóa Học: ${chemFormula.trim()} → Khối lượng Mol M = ${m} g/mol`);
  };

  // Like Post Handler
  const handleLikePost = (postId: number) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const isLiked = !p.is_liked;
        return {
          ...p,
          is_liked: isLiked,
          likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1,
        };
      }
      return p;
    });

    savePostsState(updated);
  };

  // Add Comment Handler
  const handleAddComment = async (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment: FeedComment = {
      id: Date.now(),
      author_name: currentUser.name.replace(/\s*\([^)]*\)/g, ''),
      content: commentText,
      created_at: 'Vừa xong',
    };

    const updated = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    });

    savePostsState(updated);
    setCommentInputs({ ...commentInputs, [postId]: '' });

    try {
      await fetch('/thcs/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          post_id: postId,
          author_name: newComment.author_name,
          content: newComment.content,
        }),
      });
    } catch (err) {}
  };

  // Render Image Gallery Grid
  const renderImageGallery = (images?: string[]) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="rounded-2xl overflow-hidden border border-[#E1E6F0] max-h-96">
          <img src={images[0]} alt="Attachment" className="w-full h-full object-cover" />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-[#E1E6F0] max-h-72">
          {images.map((img, idx) => (
            <img key={idx} src={img} alt={`Attached ${idx}`} className="w-full h-72 object-cover" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden border border-[#E1E6F0] max-h-80">
        {images.map((img, idx) => (
          <img key={idx} src={img} alt={`Attached ${idx}`} className="w-full h-80 object-cover" />
        ))}
      </div>
    );
  };

  const isTeacherOrAdmin = currentRole === 'homeroom_teacher' || currentRole === 'admin' || currentRole === 'superadmin';
  const currentUserCleanName = currentUser.name.replace(/\s*\([^)]*\)/g, '');

  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleMultipleFileSelect}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18243A] tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#6C63FF]" />
            Bảng Tin & Trò Chuyện {selectedClass.name}
          </h1>
          <p className="text-sm text-[#68758D] font-bold mt-1">
            Không gian chia sẻ tin tức, khen thưởng, lịch sinh hoạt & phòng chat trực tuyến tích hợp Bộ Công Cụ STEM (Toán, Hóa, Lý)
          </p>
        </div>
      </div>

      {/* SUBTAB NAVIGATION (Bảng Tin vs Phòng Trò Chuyện & Hỗ Trợ) */}
      <div className="flex items-center space-x-2 border-b border-[#E1E6F0] bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'timeline' ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#68758D] hover:bg-[#FAFBFF]'
          }`}
        >
          <Sparkles className="h-4 w-4" /> 📰 Bảng Tin Lớp Học (Feed)
        </button>

        <button
          onClick={() => setActiveSubTab('chatroom')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'chatroom' ? 'bg-[#6C63FF] text-white shadow-md' : 'text-[#68758D] hover:bg-[#FAFBFF]'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> 💬 Phòng Trò Chuyện & Hỗ Trợ (Toán, Hóa, Lý)
          {!isChatEnabled && <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded-md">Khóa</span>}
        </button>
      </div>

      {/* SUBTAB 1: CLASS TIMELINE FEED */}
      {activeSubTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multi-Image Composer Box */}
            <div className="clay-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={currentUserCleanName} avatarUrl={currentUser?.avatar_url || currentUser?.avatar} role={currentRole} size="md" status="online" />
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-[#18243A]">{currentUserCleanName}</div>
                  <div className="mt-0.5"><RoleBadge role={currentRole} size="sm" showIcon={true} /></div>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`Đăng bài viết mới lên bảng tin ${selectedClass.name}...`}
                  className="w-full rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF] p-3 text-sm font-semibold text-[#18243A] focus:border-[#6C63FF] focus:bg-white focus:outline-none transition-colors"
                />

                {attachedImageUrls.length > 0 && (
                  <div className="space-y-2 p-3 rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF]">
                    <div className="text-xs font-extrabold text-[#6C63FF] flex items-center justify-between">
                      <span>🖼️ Ảnh đã đính kèm ({attachedImageUrls.length} ảnh):</span>
                      <button
                        type="button"
                        onClick={() => setAttachedImageUrls([])}
                        className="text-[11px] text-[#FF5D68] hover:underline"
                      >
                        Xóa tất cả ảnh
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {attachedImageUrls.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-[#C0BBFD] h-24 group">
                          <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachedImage(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E1E6F0]">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] px-3 py-1.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF]"
                    >
                      <option value="📌 Thông Báo">📌 Thông Báo Lớp</option>
                      <option value="🏆 Tuyên Dương">🏆 Tuyên Dương Học Tập</option>
                      <option value="📷 Hoạt Động">📷 Hoạt Động Ngoại Khóa</option>
                      <option value="📝 Nhắc Nhở">📝 Nhắc Nhở Bài Tập</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#A3F0D9] bg-[#E6F9F3] text-xs font-extrabold text-[#0E8360] hover:bg-[#22C997] hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                      <i className="fa-solid fa-images text-sm"></i> Đính kèm ảnh
                    </button>
                  </div>

                  <Button type="submit" variant="primary" size="sm" icon={<Send className="h-4 w-4" />}>
                    Đăng bài ngay
                  </Button>
                </div>
              </form>
            </div>

            {/* Posts Timeline List */}
            <div className="space-y-6">
              {posts.length === 0 && (
                <div className="clay-card p-8 text-center space-y-2 border-[#E1E6F0] bg-white">
                  <p className="text-xs font-extrabold text-[#0E8360]">
                    ✓ Bảng tin hiện đang sạch 100%. Thầy cô và học sinh hãy tạo bài đăng đầu tiên cho {selectedClass.name}!
                  </p>
                </div>
              )}
              {posts.map((post) => (
                <div key={post.id} className="clay-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={post.author_name} role={post.author_role.includes('SuperAdmin') ? 'superadmin' : post.author_role.includes('Chủ Nhiệm') ? 'homeroom_teacher' : post.author_role.includes('Bộ môn') ? 'subject_teacher' : post.author_role.includes('Phụ huynh') ? 'parent' : 'student'} size="md" />
                      <div>
                        <div className="text-sm font-extrabold text-[#18243A] flex items-center gap-2">
                          {post.author_name}
                          <Badge variant="purple">{post.author_role}</Badge>
                        </div>
                        <div className="text-xs text-[#68758D] font-mono mt-0.5">{post.created_at} • Công khai Lớp 7A1</div>
                      </div>
                    </div>

                    <Badge variant="mint">{post.category}</Badge>
                  </div>

                  <p className="text-sm text-[#18243A] font-medium whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>

                  {renderImageGallery(post.image_urls)}

                  <div className="flex items-center justify-between pt-3 border-t border-[#E1E6F0] text-xs font-bold text-[#68758D]">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
                        post.is_liked ? 'bg-[#FFEFEF] text-[#FF5D68] font-extrabold' : 'hover:bg-[#FAFBFF] hover:text-[#FF5D68]'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-[#FF5D68]' : ''}`} />
                      <span>{post.likes_count} Thích</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#EEECFF] hover:text-[#6C63FF] transition-colors cursor-pointer">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments.length} Bình luận</span>
                    </button>

                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#FAFBFF] transition-colors cursor-pointer">
                      <Share2 className="h-4 w-4" />
                      <span>Chia sẻ</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#E1E6F0] space-y-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22C997] to-[#34D3A3] text-white flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                          {(c.author_name || 'U').charAt(0)}
                        </div>
                        <div className="p-3 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-extrabold text-[#18243A]">{c.author_name}</span>
                            <span className="text-[10px] text-[#68758D] font-mono">{c.created_at}</span>
                          </div>
                          <p className="text-xs text-[#18243A] font-medium leading-normal">{c.content}</p>
                        </div>
                      </div>
                    ))}

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Viết bình luận..."
                        className="flex-1 rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] px-3 py-1.5 text-xs font-semibold text-[#18243A] focus:border-[#6C63FF] focus:bg-white focus:outline-none"
                      />
                      <Button type="submit" size="sm" variant="primary" icon={<Send className="h-3.5 w-3.5" />}>
                        Gửi
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="clay-card p-5 space-y-4">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2 border-b border-[#E1E6F0] pb-2.5">
                <Trophy className="h-5 w-5 text-[#F6B73C]" /> Thành Viên Tích Cực Tuần
              </h3>

              <div className="space-y-3 text-xs">
                {topConductStudent ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#6C63FF] text-[#FFFFFF] font-extrabold flex items-center justify-center">
                        {(topConductStudent.student?.full_name || 'H').charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#18243A]">{topConductStudent.student.full_name}</div>
                        <div className="text-[10px] text-[#68758D]">{topConductStudent.student.group_name || 'Học sinh'}</div>
                      </div>
                    </div>
                    <Badge variant="mint">+{topConductStudent.score} đ</Badge>
                  </div>
                ) : (
                  <div className="p-3 text-center text-[#68758D] font-medium bg-[#FAFBFF] rounded-xl border border-[#E1E6F0]">
                    ✓ Chưa ghi nhận tuyên dương tuần này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REAL-TIME CLASS CHATROOM WITH INTEGRATED STEM TOOLS (TOÁN, HÓA, LÝ) */}
      {activeSubTab === 'chatroom' && (
        <div className="clay-card p-6 space-y-4 flex flex-col h-[700px] relative overflow-hidden">
          {/* Chatroom Header with Toggle Lock for GVCN/Admin */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E1E6F0] pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] text-[#6C63FF] flex items-center justify-center font-extrabold text-lg shadow-xs">
                💬
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                  Phòng Trò Chuyện {selectedClass.name} (Tích Hợp Công Cụ STEM Toán, Hóa, Lý)
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isChatEnabled ? 'bg-[#E6F9F3] text-[#0E8360] border border-[#A3F0D9]' : 'bg-[#FFEFEF] text-[#FF5D68] border border-[#FFC0C3]'}`}>
                    {isChatEnabled ? '🟢 Đang mở' : '🔒 Đang khóa'}
                  </span>
                </h3>
                <p className="text-xs text-[#68758D] font-bold">Kênh hỗ trợ và trao đổi nhanh với bộ công cụ nhập công thức Toán, Hóa học, Vật lý</p>
              </div>
            </div>

            {/* Toggle Lock Switch for GVCN / Admin / SuperAdmin ONLY */}
            {isTeacherOrAdmin && (
              <Button
                size="sm"
                variant={isChatEnabled ? 'danger' : 'mint'}
                onClick={handleToggleChatroomLock}
                icon={isChatEnabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                className="shrink-0"
              >
                {isChatEnabled ? 'Khóa Phòng Chat' : 'Bật Phòng Chat'}
              </Button>
            )}
          </div>

          {/* Locked Chat Banner Warning */}
          {!isChatEnabled && (
            <div className="p-3.5 rounded-2xl bg-[#FFEFEF] border border-[#FFC0C3] text-xs font-extrabold text-[#D32F2F] flex items-center gap-2 shadow-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>
                🔒 Phòng Chat Lớp hiện đang được khóa bởi Giáo viên chủ nhiệm. Mọi thành viên chỉ có thể xem lịch sử trao đổi.
              </span>
            </div>
          )}

          {/* Chat Messages Body Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar p-3 bg-[#FAFBFF] rounded-2xl border border-[#E1E6F0]">
            {chatMessages.length === 0 && (
              <div className="p-8 text-center space-y-2 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#EEECFF] text-[#6C63FF] flex items-center justify-center mx-auto">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-xs font-extrabold text-[#18243A]">
                  Phòng trò chuyện hiện chưa có tin nhắn nào.
                </p>
                <p className="text-[11px] text-[#68758D] font-bold">
                  Thầy cô và các em học sinh hãy nhập nội dung bên dưới để trao đổi học tập nhé!
                </p>
              </div>
            )}
            {chatMessages.map((msg) => {
              const isMyMessage = msg.author_name === currentUserCleanName || msg.is_me;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${isMyMessage ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs text-white ${
                    isMyMessage ? 'bg-gradient-to-br from-[#6C63FF] to-[#8178FF]' : 'bg-gradient-to-br from-[#22C997] to-[#34D3A3]'
                  }`}>
                    {msg.avatar_letter}
                  </div>

                  <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#68758D] mb-1">
                      <span className="text-[#18243A] font-black">{msg.author_name}</span>
                      <span className="text-[#6C63FF] text-[10px]">({msg.author_role})</span>
                      <span className="text-[10px] text-slate-400 font-mono">• {msg.created_at}</span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs whitespace-pre-line ${
                      isMyMessage
                        ? 'bg-gradient-to-r from-[#6C63FF] to-[#8178FF] text-white rounded-tr-none'
                        : 'bg-white text-[#18243A] border border-[#E1E6F0] rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* INTEGRATED STEM ACADEMIC TOOLBAR (TOÁN - HÓA - LÝ) */}
          {isChatEnabled && (
            <div className="space-y-2 border-t border-[#E1E6F0] pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFBFF] p-2 rounded-xl border border-[#E1E6F0]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-[#18243A] mr-1">Bộ công cụ học tập:</span>
                  
                  <button
                    type="button"
                    onClick={() => setStemToolMode(stemToolMode === 'math' ? 'none' : 'math')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      stemToolMode === 'math' ? 'bg-[#6C63FF] text-white' : 'bg-[#EEECFF] text-[#6C63FF] hover:bg-[#DED9FF]'
                    }`}
                  >
                    <Calculator className="h-3.5 w-3.5" /> 📐 Toán Học
                  </button>

                  <button
                    type="button"
                    onClick={() => setStemToolMode(stemToolMode === 'chem' ? 'none' : 'chem')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      stemToolMode === 'chem' ? 'bg-[#0E8360] text-white' : 'bg-[#E6F9F3] text-[#0E8360] hover:bg-[#A3F0D9]'
                    }`}
                  >
                    <FlaskConical className="h-3.5 w-3.5" /> 🧪 Hóa Học
                  </button>

                  <button
                    type="button"
                    onClick={() => setStemToolMode(stemToolMode === 'physics' ? 'none' : 'physics')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      stemToolMode === 'physics' ? 'bg-[#D97706] text-white' : 'bg-[#FFF5ED] text-[#D97706] hover:bg-[#FED7AA]'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" /> ⚡ Vật Lý
                  </button>
                </div>

                {/* Quick Emojis */}
                <div className="flex items-center gap-1">
                  {['👍', '❤️', '👏', '😊', '🎉'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendEmoji(emoji)}
                      className="p-1 hover:bg-[#EEECFF] rounded-lg transition-transform hover:scale-125 cursor-pointer text-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* MATHEMATICS TOOL DRAWER */}
              {stemToolMode === 'math' && (
                <div className="p-3 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] space-y-2 text-xs animate-in fade-in">
                  <div className="font-extrabold text-[#6C63FF] flex items-center justify-between">
                    <span>📐 Ký hiệu & Công thức Toán Học (Click để chèn vào tin nhắn):</span>
                    <button type="button" onClick={() => setStemToolMode('none')} className="text-[10px] text-[#FF5D68]">Đóng ✕</button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['√x', 'x²', 'x³', 'π', 'Δ', '∫', '∑', '∞', '≠', '≤', '≥', '±', '°', 'sin(x)', 'cos(x)'].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => handleInsertTextToChat(sym)}
                        className="px-2 py-1 rounded-md bg-white border border-[#C0BBFD] font-mono font-bold text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#C0BBFD]/60 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#18243A]">Giải pt ax² + bx + c = 0:</span>
                    <input
                      type="number"
                      placeholder="a"
                      value={mathA}
                      onChange={(e) => setMathA(e.target.value)}
                      className="w-12 p-1 rounded-lg border border-[#C0BBFD] bg-white text-center font-mono font-bold"
                    />
                    <span>x² +</span>
                    <input
                      type="number"
                      placeholder="b"
                      value={mathB}
                      onChange={(e) => setMathB(e.target.value)}
                      className="w-12 p-1 rounded-lg border border-[#C0BBFD] bg-white text-center font-mono font-bold"
                    />
                    <span>x +</span>
                    <input
                      type="number"
                      placeholder="c"
                      value={mathC}
                      onChange={(e) => setMathC(e.target.value)}
                      className="w-12 p-1 rounded-lg border border-[#C0BBFD] bg-white text-center font-mono font-bold"
                    />
                    <span>= 0</span>
                    <button
                      type="button"
                      onClick={handleSolveQuadratic}
                      className="px-2.5 py-1 rounded-lg bg-[#6C63FF] text-white font-extrabold hover:bg-[#5148E5]"
                    >
                      Giải & Chèn kết quả
                    </button>
                  </div>
                </div>
              )}

              {/* CHEMISTRY TOOL DRAWER */}
              {stemToolMode === 'chem' && (
                <div className="p-3 rounded-2xl bg-[#E6F9F3] border border-[#A3F0D9] space-y-2 text-xs animate-in fade-in">
                  <div className="font-extrabold text-[#0E8360] flex items-center justify-between">
                    <span>🧪 Công Thức & Phản Ứng Hóa Học (Click để chèn):</span>
                    <button type="button" onClick={() => setStemToolMode('none')} className="text-[10px] text-[#FF5D68]">Đóng ✕</button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['H₂O', 'CO₂', 'H₂SO₄', 'HCl', 'NaOH', 'NaCl', 'CaCO₃', 'O₂', 'H₂', 'Fe', 'Cu', 'Al', 'Ca(OH)₂', '→', '⇌', '↑', '↓', 't°'].map((chem) => (
                      <button
                        key={chem}
                        type="button"
                        onClick={() => handleInsertTextToChat(chem)}
                        className="px-2 py-1 rounded-md bg-white border border-[#A3F0D9] font-bold text-[#0E8360] hover:bg-[#0E8360] hover:text-white transition-colors"
                      >
                        {chem}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#A3F0D9]/60 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#18243A]">Tính khối lượng Mol (M):</span>
                    <input
                      type="text"
                      placeholder="VD: H2SO4"
                      value={chemFormula}
                      onChange={(e) => setChemFormula(e.target.value)}
                      className="w-28 p-1 rounded-lg border border-[#A3F0D9] bg-white text-center font-mono font-bold uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleCalculateChemMolar}
                      className="px-2.5 py-1 rounded-lg bg-[#0E8360] text-white font-extrabold hover:bg-[#0A6448]"
                    >
                      Tính M & Chèn vào Chat
                    </button>
                  </div>
                </div>
              )}

              {/* PHYSICS TOOL DRAWER */}
              {stemToolMode === 'physics' && (
                <div className="p-3 rounded-2xl bg-[#FFF5ED] border border-[#FED7AA] space-y-2 text-xs animate-in fade-in">
                  <div className="font-extrabold text-[#D97706] flex items-center justify-between">
                    <span>⚡ Công Thức & Hằng Số Vật Lý (Click để chèn):</span>
                    <button type="button" onClick={() => setStemToolMode('none')} className="text-[10px] text-[#FF5D68]">Đóng ✕</button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'v = s / t',
                      'I = U / R',
                      'P = U × I',
                      'A = F × s',
                      'p = F / S',
                      'P = m × g',
                      'g = 9.8 m/s²',
                      'c = 3×10⁸ m/s',
                      'D = m / V'
                    ].map((phy) => (
                      <button
                        key={phy}
                        type="button"
                        onClick={() => handleInsertTextToChat(phy)}
                        className="px-2.5 py-1 rounded-md bg-white border border-[#FED7AA] font-mono font-bold text-[#D97706] hover:bg-[#D97706] hover:text-white transition-colors"
                      >
                        {phy}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              disabled={!isChatEnabled}
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              placeholder={isChatEnabled ? "Nhập tin nhắn (dùng công cụ Toán/Hóa/Lý bên trên)..." : "🔒 Phòng chat đang khóa..."}
              className="flex-1 rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF] px-4 py-2.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:bg-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!isChatEnabled || !newChatMessage.trim()}
              icon={<Send className="h-4 w-4" />}
              className="shrink-0"
            >
              Gửi tin
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
