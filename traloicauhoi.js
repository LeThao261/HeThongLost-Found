// Khởi tạo thư viện Icon Lucide khi trang vừa load
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // Lấy các element cần thiết từ DOM
    const options = document.querySelectorAll('.option-item');
    const submitBtn = document.querySelector('.btn-submit');
    const toastContainer = document.getElementById('toast-container');

    // 1. Logic xử lý Click vào đáp án (cho phép chọn nhiều đáp án)
    options.forEach(option => {
        option.addEventListener('click', function() {
            // Thêm/Xóa class 'selected' cho đáp án vừa click
            this.classList.toggle('selected');
            
            // Kiểm tra xem hiện tại có đáp án nào đang được chọn không
            const hasSelection = document.querySelectorAll('.option-item.selected').length > 0;
            
            // Bật hoặc tắt nút Submit
            if (hasSelection) {
                submitBtn.classList.add('active');
                submitBtn.removeAttribute('disabled');
            } else {
                submitBtn.classList.remove('active');
                submitBtn.setAttribute('disabled', 'true');
            }
        });
    });

    // 2. Logic Xử lý khi bấm nút "Gửi câu trả lời"
    submitBtn.addEventListener('click', function() {
        // Chỉ chạy code nếu nút đang ở trạng thái active (được phép bấm)
        if (this.classList.contains('active')) {
            
            // Hiện thông báo Toast
            showToast('Gửi câu trả lời thành công');
            
            // Vô hiệu hóa nút trong lúc "giả lập" hệ thống xử lý (để tránh spam click)
            this.classList.remove('active');
            this.setAttribute('disabled', 'true');
            this.textContent = 'Đang xử lý...';
            
            // Phục hồi lại nút sau 3 giây (Sa có thể thay thế đoạn này bằng logic call API gửi data lên Backend)
            setTimeout(() => {
                this.textContent = 'Gửi câu trả lời';
                // Nếu vẫn còn đáp án được chọn thì bật lại nút
                if (document.querySelectorAll('.option-item.selected').length > 0) {
                    this.classList.add('active');
                    this.removeAttribute('disabled');
                }
            }, 3000);
        }
    });

    // 3. Hàm tạo và hiển thị Toast Notification
    function showToast(message) {
        // Tạo thẻ div cho toast
        const toast = document.createElement('div');
        toast.classList.add('toast');
        
        // Cấu trúc HTML bên trong Toast
        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="check-circle" size="20"></i>
            </div>
            <span class="toast-text">${message}</span>
        `;
        
        // Thêm Toast vào Container trên giao diện
        toastContainer.appendChild(toast);
        
        // Render lại icon bên trong Toast vừa tạo
        lucide.createIcons(); 

        // Tự động xóa Toast sau 3.3 giây (sau khi hiệu ứng CSS slideOut chạy xong)
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 3300);
    }
});