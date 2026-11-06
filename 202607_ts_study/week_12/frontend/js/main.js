
const loginForm = document.querySelector('#loginForm');
const loginSection = document.querySelector('#loginSection');
const mainSection = document.querySelector('#mainSection');

const loginMessage = document.querySelector('#loginMessage');
const welcomeMessage = document.querySelector('#welcomeMessage');
const employeeInfo = document.querySelector('#employeeInfo');
const userAvatarBadge = document.querySelector('#userAvatarBadge');
const demoModeBtn = document.querySelector('#demoModeBtn');

let currentEmployee = null;
let allEmployees = []; // 직원 연락망 캐시 및 검색용
let isDemoMode = false;

// 실시간 디지털 시계
function updateLiveClock() {
    const clockEl = document.querySelector('#liveClock');
    if (!clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

// 로그인 테스트 계정 힌트 클릭 시 자동 입력
const loginHint = document.querySelector('.login-hint');
if (loginHint) {
    loginHint.addEventListener('click', () => {
        document.querySelector('#loginId').value = 'baek01';
        document.querySelector('#password').value = 'test1234';
    });
}

// 사용자 프로필 화면 반영
function updateProfileUI(employee) {
    if (!employee) return;
    welcomeMessage.textContent = `${employee.name}님 환영합니다`;
    employeeInfo.textContent = `${employee.department} · ${employee.position}`;
    if (userAvatarBadge) {
        userAvatarBadge.textContent = (employee.name || '사')[0];
    }
}

// HTML 특수문자 처리
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// 이미지 폴백 SVG (data-uri)
const fallbackImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f1f5f9"/><circle cx="200" cy="130" r="36" fill="%23cbd5e1"/><polygon points="120,240 280,240 200,160" fill="%23e2e8f0"/><text x="50%" y="270" text-anchor="middle" fill="%2394a3b8" font-size="14" font-family="sans-serif">이미지 준비중</text></svg>`;

// ==========================================================================
// 데모 모드 모의 데이터 (Mock Data)
// ==========================================================================
const mockData = {
    attendance: {
        check_in: '08:52:14',
        check_out: null
    },
    galleries: [
        {
            photo_id: 1,
            photo_title: '2026 하반기 전사 워크숍 및 비전 선포식',
            description: '새로운 도약을 다짐하며 전 임직원이 함께한 가을 워크숍 현장입니다. 뜨거운 열정과 즐거운 화합의 시간이었습니다!',
            image_path: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
            is_external: true,
            view_count: 142,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            photo_id: 2,
            photo_title: '스마트 오피스 라운지 리뉴얼 오픈',
            description: '자유로운 소통과 몰입을 지원하는 3층 힐링 라운지가 새롭게 단장되었습니다. 커피 머신과 안마의자를 편하게 이용해 보세요.',
            image_path: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            is_external: true,
            view_count: 98,
            created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
            photo_id: 3,
            photo_title: '사내 동호회 해커톤 프로젝트 성료',
            description: '주말 동안 진행된 혁신 아이디어 해커톤에서 우수한 프로젝트들이 탄생했습니다. 참가하신 모든 팀원분들 고생 많으셨습니다.',
            image_path: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
            is_external: true,
            view_count: 76,
            created_at: new Date(Date.now() - 86400000 * 9).toISOString()
        }
    ],
    comments: {
        1: [
            { comment_id: 101, user_id: 2, user_name: '김지현 팀장', content: '다들 밝은 모습으로 함께해서 너무 뜻깊은 시간이었습니다 ^^', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
            { comment_id: 102, user_id: 1, user_name: '백승우 대리', content: '워크숍 팀빌딩 게임 정말 흥미진진했어요! 다음 워크숍도 기대됩니다.', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
        ],
        2: [
            { comment_id: 201, user_id: 3, user_name: '박서준 책임', content: '라운지 원두 커피 진짜 맛있네요. 휴식하기 최고입니다.', created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
        ],
        3: [
            { comment_id: 301, user_id: 4, user_name: '이지은 선임', content: '모두 고생 많으셨습니다! 멋진 결과물 기대할게요.', created_at: new Date(Date.now() - 3600000 * 20).toISOString() }
        ]
    },
    contacts: [
        { id: 1, name: '백승우', department: '플랫폼개발팀', position: '대리', extension_num: '101', phone: '010-2345-6789', email: 'baek@syncflow.io' },
        { id: 2, name: '김지현', department: '플랫폼개발팀', position: '팀장', extension_num: '102', phone: '010-3456-7890', email: 'kim.jh@syncflow.io' },
        { id: 3, name: '박서준', department: '프로덕트디자인팀', position: '책임연구원', extension_num: '201', phone: '010-4567-8901', email: 'park.sj@syncflow.io' },
        { id: 4, name: '이지은', department: 'UI/UX기획팀', position: '선임연구원', extension_num: '202', phone: '010-5678-9012', email: 'lee.je@syncflow.io' },
        { id: 5, name: '최민호', department: '경영지원팀', position: '수석매니저', extension_num: '301', phone: '010-6789-0123', email: 'choi.mh@syncflow.io' },
        { id: 6, name: '정수빈', department: '인재개발팀', position: '매니저', extension_num: '302', phone: '010-7890-1234', email: 'jung.sb@syncflow.io' }
    ]
};

// 데모 모드 버튼 이벤트
if (demoModeBtn) {
    demoModeBtn.addEventListener('click', () => {
        isDemoMode = true;
        const demoEmployee = {
            id: 1,
            name: '백승우',
            department: '플랫폼개발팀',
            position: '대리'
        };

        currentEmployee = demoEmployee;
        localStorage.setItem('currentEmployee', JSON.stringify(demoEmployee));
        localStorage.setItem('isDemoMode', 'true');

        loginSection.hidden = true;
        mainSection.hidden = false;

        updateProfileUI(demoEmployee);

        loadAttendance();
        loadGalleries();
        loadEmployeeContacts();
    });
}

// 로그인
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const login_id = document.querySelector('#loginId').value.trim();
    const password = document.querySelector('#password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!login_id || !password) {
        loginMessage.textContent = '아이디와 비밀번호를 모두 입력해 주세요.';
        loginMessage.className = 'login-message error';
        return;
    }

    loginMessage.textContent = '로그인 확인 중...';
    loginMessage.className = 'login-message';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login_id,
                password
            })
        });

        const result = await response.json();

        if (result.code !== 200) {
            loginMessage.textContent = result.message || '로그인에 실패했습니다. 아이디나 비밀번호를 확인해 주세요.';
            loginMessage.className = 'login-message error';
            submitBtn.disabled = false;
            return;
        }

        // 로그인 성공
        const employee = result.data;
        isDemoMode = false;
        localStorage.removeItem('isDemoMode');

        const safeEmployee = { ...employee };
        delete safeEmployee.password;

        currentEmployee = safeEmployee;

        localStorage.setItem(
            'currentEmployee',
            JSON.stringify(safeEmployee)
        );

        // 화면 전환
        loginSection.hidden = true;
        mainSection.hidden = false;

        updateProfileUI(employee);

        // 오늘 출퇴근 기록 및 데이터 조회
        await loadAttendance();
        await loadGalleries();
        await loadEmployeeContacts();

    } catch (error) {
        console.error('로그인 오류:', error);
        loginMessage.innerHTML = `서버 연결에 실패했습니다.<br><small style="font-size:12px;opacity:0.9;">백엔드 서버(포트 3000) 상태를 확인하시거나 아래 [서버 없이 UI 디자인 바로 체험하기]를 이용해 보세요.</small>`;
        loginMessage.className = 'login-message error';
    } finally {
        submitBtn.disabled = false;
    }
});

// 로그아웃
document.querySelector('#logoutBtn').addEventListener('click', () => {
    mainSection.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();
    loginMessage.textContent = '';
    loginMessage.className = 'login-message';
    currentEmployee = null;
    isDemoMode = false;
    localStorage.removeItem('currentEmployee');
    localStorage.removeItem('isDemoMode');

    // 출퇴근 정보 초기화
    document.querySelector('#workDate').textContent = '근무일 로딩 중...';
    document.querySelector('#checkInTime').textContent = '-';
    document.querySelector('#checkOutTime').textContent = '-';
    attendanceMessage.textContent = '';
    attendanceMessage.className = 'attendance-msg';

    checkInBtn.disabled = false;
    checkOutBtn.disabled = true;

    // 탭 메뉴 첫 번째로 리셋
    resetMenuTab();
});

function resetMenuTab() {
    mainMenu.querySelectorAll('button[data-target]').forEach((btn, index) => {
        btn.classList.toggle('active', index === 0);
    });
    document.querySelector('#attendanceSection').hidden = false;
    document.querySelector('#gallerySection').hidden = true;
    document.querySelector('#contactSection').hidden = true;

    // 갤러리 상세 화면 열려있던 경우 목록으로 초기화
    const galleryListView = document.querySelector('#galleryListView');
    const galleryDetailView = document.querySelector('#galleryDetailView');
    if (galleryListView && galleryDetailView) {
        galleryListView.hidden = false;
        galleryDetailView.hidden = true;
    }

    // 화면 상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 헤더 브랜드 로고 클릭 시 메인(근태 관리 대시보드) 화면으로 이동
const headerBrand = document.querySelector('.header-brand');
if (headerBrand) {
    headerBrand.addEventListener('click', () => {
        resetMenuTab();
    });
}

const checkInBtn = document.querySelector('#checkInBtn');
const checkOutBtn = document.querySelector('#checkOutBtn');
const attendanceMessage = document.querySelector('#attendanceMessage');

// 오늘 출퇴근 기록 조회
async function loadAttendance() {
    const todayStr = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });
    document.querySelector('#workDate').textContent = `근무일: ${todayStr}`;

    if (isDemoMode) {
        const attendance = mockData.attendance;
        document.querySelector('#checkInTime').textContent = attendance.check_in || '-';
        document.querySelector('#checkOutTime').textContent = attendance.check_out || '-';

        checkInBtn.disabled = !!attendance.check_in;
        checkOutBtn.disabled = !attendance.check_in || !!attendance.check_out;
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/attendance/${currentEmployee.id}/today`
        );

        const result = await response.json();

        if (result.code !== 200) {
            attendanceMessage.textContent = result.message;
            attendanceMessage.className = 'attendance-msg info';
            return;
        }

        const attendance = result.data;

        document.querySelector('#checkInTime').textContent =
            attendance?.check_in || '-';

        document.querySelector('#checkOutTime').textContent =
            attendance?.check_out || '-';

        checkInBtn.disabled = !!attendance;
        checkOutBtn.disabled =
            !attendance || !!attendance.check_out;

    } catch (error) {
        console.error('출퇴근 조회 오류:', error);
    }
}

// 출근하기
checkInBtn.addEventListener('click', () => {
    handleAttendance('check-in');
});

// 퇴근하기
checkOutBtn.addEventListener('click', () => {
    handleAttendance('check-out');
});

// 출퇴근 공통 처리
async function handleAttendance(type) {
    const isCheckIn = type === 'check-in';
    const nowTimeStr = new Date().toLocaleTimeString('ko-KR', { hour12: false });

    if (isDemoMode) {
        if (isCheckIn) {
            mockData.attendance.check_in = nowTimeStr;
            attendanceMessage.textContent = `[체험] 출근이 정상적으로 처리되었습니다. (${nowTimeStr})`;
        } else {
            mockData.attendance.check_out = nowTimeStr;
            attendanceMessage.textContent = `[체험] 퇴근이 정상적으로 처리되었습니다. 수고하셨습니다! (${nowTimeStr})`;
        }
        attendanceMessage.className = 'attendance-msg success';
        await loadAttendance();
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/api/attendance/${type}`,
            {
                method: isCheckIn ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentEmployee.id
                })
            }
        );

        const result = await response.json();

        attendanceMessage.textContent = result.message;
        attendanceMessage.className = result.code === 200 ? 'attendance-msg success' : 'attendance-msg error';

        if (result.code === 200) {
            await loadAttendance();
        }

    } catch (error) {
        console.error('출퇴근 처리 오류:', error);
        attendanceMessage.textContent = '서버 연결에 실패했습니다.';
        attendanceMessage.className = 'attendance-msg error';
    }
}

const galleryList = document.querySelector('#galleryList');
const galleryDetail = document.querySelector('#galleryDetail');

// 이미지 URL 생성 헬퍼
function getImageUrl(photo) {
    if (photo.is_external || (photo.image_path && photo.image_path.startsWith('http'))) {
        return photo.image_path;
    }
    return `http://localhost:3000/${photo.image_path}`;
}

// 포토갤러리 목록 조회
async function loadGalleries() {
    let photos = [];

    if (isDemoMode) {
        photos = mockData.galleries;
    } else {
        try {
            const response = await fetch('http://localhost:3000/api/photo-gallery');
            const result = await response.json();

            if (result.code !== 200) {
                galleryList.innerHTML = `<div class="empty-state">${escapeHTML(result.message)}</div>`;
                return;
            }
            photos = result.data || [];
        } catch (error) {
            console.error('갤러리 조회 오류:', error);
            galleryList.innerHTML = `<div class="empty-state">갤러리 목록을 불러오지 못했습니다.</div>`;
            return;
        }
    }

    if (!photos || photos.length === 0) {
        galleryList.innerHTML = `<div class="empty-state">등록된 갤러리 게시물이 없습니다.</div>`;
        return;
    }

    galleryList.innerHTML = photos.map((photo) => `
        <article class="gallery-card" data-id="${photo.photo_id}">
            <div class="gallery-card-thumb">
                <img
                    src="${getImageUrl(photo)}"
                    alt="${escapeHTML(photo.photo_title)}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${fallbackImage}';"
                >
                <div class="thumb-overlay">
                    <span class="overlay-text">자세히 보기</span>
                </div>
            </div>
            <div class="gallery-card-body">
                <h3 class="gallery-card-title">${escapeHTML(photo.photo_title)}</h3>
                <p class="gallery-card-desc">${escapeHTML(photo.description || '내용이 등록되지 않았습니다.')}</p>
                <div class="gallery-card-footer">
                    <span class="card-meta views">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        ${photo.view_count || 0}
                    </span>
                    <span class="card-meta date">
                        ${photo.created_at ? new Date(photo.created_at).toLocaleDateString('ko-KR') : ''}
                    </span>
                </div>
            </div>
        </article>
    `).join('');
}

galleryList.addEventListener('click', (event) => {
    const card = event.target.closest('.gallery-card');

    if (!card) return;

    const photoId = card.dataset.id;

    loadGalleryDetail(photoId);
});

// 포토갤러리 상세 조회
async function loadGalleryDetail(id) {
    let photo = null;

    if (isDemoMode) {
        photo = mockData.galleries.find(p => String(p.photo_id) === String(id));
        if (photo) {
            photo.view_count = (photo.view_count || 0) + 1;
        }
    } else {
        try {
            // 1. 조회수 증가 API 호출
            const viewResponse = await fetch(
                `http://localhost:3000/api/photo-gallery/${id}/views`,
                {
                    method: 'PATCH'
                }
            );

            const viewResult = await viewResponse.json();

            if (viewResult.code !== 200) {
                alert(viewResult.message);
                return;
            }

            // 2. 최신 상세 정보 조회
            const response = await fetch(
                `http://localhost:3000/api/photo-gallery/${id}`
            );

            const result = await response.json();

            if (result.code !== 200) {
                galleryDetail.textContent = result.message;
                return;
            }

            photo = result.data;
        } catch (error) {
            console.error('갤러리 상세 조회 오류:', error);
            return;
        }
    }

    if (!photo) return;

    // 목록 화면 숨기기 & 상세 화면 표시
    document.querySelector('#galleryListView').hidden = true;
    document.querySelector('#galleryDetailView').hidden = false;

    // 댓글 영역에 게시글 ID 연결
    document.querySelector('#commentForm').dataset.photoId = photo.photo_id;

    galleryDetail.innerHTML = `
        <div class="gallery-detail-toolbar">
            <button type="button" id="galleryBackBtn" class="btn-back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>목록으로 돌아가기</span>
            </button>
        </div>

        <article class="gallery-detail-card">
            <div class="gallery-detail-img-box">
                <img
                    src="${getImageUrl(photo)}"
                    alt="${escapeHTML(photo.photo_title)}"
                    onerror="this.onerror=null; this.src='${fallbackImage}';"
                >
            </div>

            <div class="gallery-detail-body">
                <div class="gallery-detail-meta-bar">
                    <span class="detail-category-badge">사내 소식</span>
                    <span class="detail-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${new Date(photo.created_at).toLocaleString('ko-KR')}
                    </span>
                    <span class="detail-meta-item views">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        조회수 ${photo.view_count}
                    </span>
                </div>

                <h3 class="gallery-detail-title">${escapeHTML(photo.photo_title)}</h3>
                <div class="gallery-detail-content-text">${escapeHTML(photo.description || '내용이 없습니다.')}</div>
            </div>
        </article>
    `;

    // 댓글 목록 불러오기
    loadComments(photo.photo_id);

    // 목록으로 돌아가기
    document.querySelector('#galleryBackBtn')
        .addEventListener('click', () => {
            document.querySelector('#galleryDetailView').hidden = true;
            document.querySelector('#galleryListView').hidden = false;
            loadGalleries(); // 조회수 반영을 위해 목록 재조회
        });
}

// 댓글 목록 조회
async function loadComments(photoId) {
    const commentList = document.querySelector('#commentList');
    let comments = [];

    if (isDemoMode) {
        comments = mockData.comments[photoId] || [];
    } else {
        try {
            const response = await fetch(
                `http://localhost:3000/api/photo-gallery/${photoId}/comments`
            );

            const result = await response.json();

            if (result.code !== 200) {
                commentList.textContent = result.message;
                return;
            }
            comments = result.data || [];
        } catch (error) {
            console.error('댓글 목록 조회 오류:', error);
            commentList.textContent = '댓글을 불러오지 못했습니다.';
            return;
        }
    }

    if (!comments || comments.length === 0) {
        commentList.innerHTML = '<div class="empty-comment">등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!</div>';
        return;
    }

    commentList.innerHTML = comments.map((comment) => {
        const initial = (comment.user_name || '사')[0];
        const isOwner = Number(comment.user_id) === Number(currentEmployee.id);
        return `
        <div class="comment-item">
            <div class="comment-avatar">${escapeHTML(initial)}</div>
            <div class="comment-content-wrap">
                <div class="comment-header">
                    <strong class="comment-author">${escapeHTML(comment.user_name)}</strong>
                    <small class="comment-date">
                        ${new Date(comment.created_at).toLocaleString('ko-KR')}
                    </small>
                    ${isOwner ? `
                        <button
                            type="button"
                            class="comment-delete-btn"
                            data-id="${comment.comment_id}"
                            title="댓글 삭제"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            삭제
                        </button>
                    ` : ''}
                </div>
                <p class="comment-text">${escapeHTML(comment.content)}</p>
            </div>
        </div>
        `;
    }).join('');
}

// 댓글 등록 이벤트
document.querySelector('#galleryDetailView')
    .addEventListener('submit', async (event) => {
        if (event.target.id !== 'commentForm') return;

        event.preventDefault();

        const photoId = event.target.dataset.photoId;
        const textarea = event.target.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            alert('댓글 내용을 입력해 주세요.');
            return;
        }

        if (isDemoMode) {
            if (!mockData.comments[photoId]) {
                mockData.comments[photoId] = [];
            }
            mockData.comments[photoId].push({
                comment_id: Date.now(),
                user_id: currentEmployee.id,
                user_name: `${currentEmployee.name} ${currentEmployee.position}`,
                content,
                created_at: new Date().toISOString()
            });

            textarea.value = '';
            await loadComments(photoId);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/api/photo-gallery/${photoId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentEmployee.id,
                        content
                    })
                }
            );

            const result = await response.json();

            if (result.code !== 201) {
                alert(result.message);
                return;
            }

            event.target.reset();
            await loadComments(photoId);

        } catch (error) {
            console.error('댓글 작성 오류:', error);
        }
    });

// 댓글 삭제 이벤트
document.querySelector('#galleryDetailView')
    .addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('.comment-delete-btn');

        if (!deleteBtn) return;

        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        const commentId = deleteBtn.dataset.id;
        const photoId = document.querySelector('#commentForm').dataset.photoId;

        if (isDemoMode) {
            if (mockData.comments[photoId]) {
                mockData.comments[photoId] = mockData.comments[photoId].filter(
                    c => String(c.comment_id) !== String(commentId)
                );
            }
            await loadComments(photoId);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/api/photo-gallery/comments/${commentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentEmployee.id
                    })
                }
            );

            const result = await response.json();

            if (result.code !== 200) {
                alert(result.message);
                return;
            }

            await loadComments(photoId);

        } catch (error) {
            console.error('댓글 삭제 오류:', error);
        }
    });

const contactList = document.querySelector('#contactList');
const contactSearchInput = document.querySelector('#contactSearchInput');

// 직원 연락처 카드 HTML 렌더링
function renderEmployeeCards(employees) {
    if (!employees || employees.length === 0) {
        contactList.innerHTML = `<div class="empty-state">검색 결과 또는 등록된 직원이 없습니다.</div>`;
        return;
    }

    contactList.innerHTML = employees.map((employee) => {
        const initial = (employee.name || '사')[0];
        return `
        <article class="contact-card">
            <div class="contact-card-top">
                <div class="contact-avatar-box">
                    <span class="contact-avatar-char">${escapeHTML(initial)}</span>
                </div>
                <div class="contact-profile-info">
                    <div class="contact-name-row">
                        <h3 class="contact-name">${escapeHTML(employee.name)}</h3>
                        <span class="contact-badge">${escapeHTML(employee.department)}</span>
                    </div>
                    <span class="contact-position-text">${escapeHTML(employee.position)}</span>
                </div>
            </div>

            <div class="contact-divider"></div>

            <div class="contact-info-list">
                <div class="contact-info-row">
                    <span class="contact-label">내선번호</span>
                    <span class="contact-val extension">${escapeHTML(employee.extension_num || '-')}</span>
                </div>
                <div class="contact-info-row">
                    <span class="contact-label">전화번호</span>
                    <span class="contact-val">
                        ${employee.phone ? `<a href="tel:${escapeHTML(employee.phone)}" class="contact-link" title="전화 걸기">${escapeHTML(employee.phone)}</a>` : '-'}
                    </span>
                </div>
                <div class="contact-info-row">
                    <span class="contact-label">이메일</span>
                    <span class="contact-val">
                        ${employee.email ? `<a href="mailto:${escapeHTML(employee.email)}" class="contact-link" title="이메일 보내기">${escapeHTML(employee.email)}</a>` : '-'}
                    </span>
                </div>
            </div>
        </article>
        `;
    }).join('');
}

// 직원 연락망 검색 필터링
if (contactSearchInput) {
    contactSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            renderEmployeeCards(allEmployees);
            return;
        }

        const filtered = allEmployees.filter(emp => {
            const name = (emp.name || '').toLowerCase();
            const dept = (emp.department || '').toLowerCase();
            const pos = (emp.position || '').toLowerCase();
            const ext = (emp.extension_num || '').toLowerCase();
            return name.includes(query) || dept.includes(query) || pos.includes(query) || ext.includes(query);
        });

        renderEmployeeCards(filtered);
    });
}

// 직원 연락망 조회
async function loadEmployeeContacts() {
    if (isDemoMode) {
        allEmployees = mockData.contacts;
        renderEmployeeCards(allEmployees);
        return;
    }

    try {
        const response = await fetch(
            'http://localhost:3000/api/employees/contacts'
        );

        const result = await response.json();

        if (result.code !== 200) {
            contactList.textContent = result.message;
            return;
        }

        allEmployees = result.data || [];
        renderEmployeeCards(allEmployees);

    } catch (error) {
        console.error('직원 연락망 조회 오류:', error);
        contactList.textContent = '직원 연락망을 불러오지 못했습니다.';
    }
}

const mainMenu = document.querySelector('#mainMenu');

// 메뉴 클릭 이벤트
mainMenu.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-target]');

    if (!button) return;

    const targetId = button.dataset.target;

    // 모든 탭 active 클래스 해제 및 현재 탭에 active 부여
    mainMenu.querySelectorAll('button[data-target]').forEach((btn) => {
        btn.classList.toggle('active', btn === button);
    });

    // 모든 콘텐츠 숨기기
    const sections = [
        'attendanceSection',
        'gallerySection',
        'contactSection'
    ];

    sections.forEach((id) => {
        const sec = document.querySelector(`#${id}`);
        if (sec) sec.hidden = true;
    });

    // 선택한 콘텐츠만 표시
    const activeSection = document.querySelector(`#${targetId}`);
    if (activeSection) {
        activeSection.hidden = false;

        // 갤러리 섹션 선택 시 항상 목록 보기로 시작
        if (targetId === 'gallerySection') {
            document.querySelector('#galleryListView').hidden = false;
            document.querySelector('#galleryDetailView').hidden = true;
        }
    }
});

// 새로고침 시 로그인 상태 확인
const savedEmployee = localStorage.getItem('currentEmployee');
const savedIsDemo = localStorage.getItem('isDemoMode') === 'true';

if (savedEmployee) {
    try {
        currentEmployee = JSON.parse(savedEmployee);
        isDemoMode = savedIsDemo;

        // 로그인 화면 숨기기
        loginSection.hidden = true;
        mainSection.hidden = false;

        // 사용자 정보 복구
        updateProfileUI(currentEmployee);

        // 기존 데이터 불러오기
        loadAttendance();
        loadGalleries();
        loadEmployeeContacts();
    } catch (e) {
        localStorage.removeItem('currentEmployee');
        localStorage.removeItem('isDemoMode');
    }
}
