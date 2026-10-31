# Cute Dating Scheduler · Twinkle Twinkle

Ứng dụng gồm Next.js App Router ở thư mục gốc và .NET 8 Web API ở `backend/CuteDatingScheduler.Api`. MongoDB chạy bằng Docker Compose.

## Đã hoàn thành: Bước 1, 2, 3, 4 và 5

- Tailwind palette pastel: `twinkle.sky`, `twinkle.pink`, `twinkle.lavender`, `twinkle.yellow`.
- Font Quicksand, nền sao/mây chuyển động, hiệu ứng hover/glow và chuyển cảnh có hỗ trợ giảm chuyển động.
- MongoDB entities: `CoupleProfile`, `Location`, `ComboDate`, `Voucher`, `DateEvent`, `DateEditHistory`, `DateMemories`.
- Mongo context đã map collection và ObjectId references cho location, combo, voucher.
- Các route `/`, `/memories`, `/admin` đã có giao diện và kết nối API tương ứng.
- API CRUD địa điểm, combo, voucher; hồ sơ cặp đôi.
- API wizard tạo lịch, veto, đổi lịch có lý do và lịch sử, đánh dấu hoàn thành, viết kỷ niệm, upload ảnh.
- Email HTML qua SMTP và xác nhận RSVP bằng liên kết có token ký, hết hạn sau 14 ngày.
- Cookie đăng nhập admin bảo vệ các API quản trị và danh sách lịch chờ/từ chối.
- Dashboard `/admin` có đăng nhập, thống kê, tìm kiếm, CRUD địa điểm/combo/voucher, quản lý hồ sơ cặp đôi và danh sách lịch hẹn có bộ lọc.
- Wizard `/` dùng chọn địa điểm/combo trực tiếp; không dùng thao tác quẹt. TikTok review dùng Embed Player của TikTok khi URL chứa video ID hợp lệ.
- Trang chủ giới thiệu ứng dụng; nút Bắt đầu mở wizard dạng popup. Wizard có bốn bước: lịch cùng giờ/điểm đón/dresscode trên một màn hình, tạo roadmap hoặc chọn combo, chọn voucher, review & gửi thư/veto. Bước review hiển thị timeline sinh động với từng điểm dừng, dresscode, voucher, lời nhắn và chi phí dự kiến. Roadmap hỗ trợ lọc theo khu vực/loại hình, kéo địa điểm vào lộ trình và đổi thứ tự các điểm dừng. Tên người gửi lấy từ hồ sơ cặp đôi hoặc tên mặc định. Có thể quay lại sửa; đóng popup vẫn giữ bản nháp trong phiên trang hiện tại. Veto lưu trạng thái `Rejected` và xóa lựa chọn hiện tại trên giao diện.
- Trang `/memories` hiển thị cả lời mời `Pending`, lịch `Accepted` và yêu cầu `Reschedule` để xem/chỉnh sửa; countdown theo lịch `Accepted`. Có thể mở lịch bằng mã khi API cũ chưa có danh sách kế hoạch. Timeline Polaroid dành cho lịch `Completed`, kèm popup lịch sử đổi lịch, upload JPEG/PNG/WebP, review và emoji.
- Popup đổi lịch bắt buộc nhập lý do, chọn trực tiếp địa điểm hoặc combo, gọi `PUT /api/date-events/{id}/reschedule` để backend lưu `editHistory` và gửi email.

## Kiến trúc thư mục

```text
app/                              # Next.js routes và global theme
components/admin/                 # Dashboard, drawer CRUD, hồ sơ cặp đôi
components/wizard/                # Wizard bốn bước, lịch ngày và roadmap kéo thả
components/memories/              # Countdown, Polaroid timeline, memory/edit modals
lib/memories-api.ts               # Catalog, upload ảnh, memories và reschedule
lib/admin-api.ts                  # Fetch client với cookie quản trị và lỗi API
lib/wizard-api.ts                 # Catalog, gửi thư, veto
lib/wizard-utils.ts               # Ngày giờ Việt Nam và TikTok player URL
lib/types.ts                      # TypeScript contracts đồng bộ với API
backend/CuteDatingScheduler.Api/  # .NET Web API + MongoDB Driver
  Data/                            # settings và collection context
  Models/                          # document schemas và nested value objects
docker-compose.yml                # API, MongoDB, Mailpit local
```

## Chạy local

Mở Docker Desktop trước, rồi chạy API, MongoDB và Mailpit:

```bash
docker compose up -d --build
```

Chạy frontend trong terminal khác:

```bash
npm install
npm run dev
```

Nếu đã cài .NET 8 SDK, có thể chạy API trực tiếp thay cho container `api`:

```bash
docker compose up -d mongodb mailpit
dotnet restore backend/CuteDatingScheduler.Api/CuteDatingScheduler.Api.csproj
dotnet run --project backend/CuteDatingScheduler.Api
```

Frontend chạy tại `http://localhost:3000`.

Để xem email trong môi trường local, mở `http://localhost:8025`. API chạy tại `http://localhost:5000`; Swagger tại `http://localhost:5000/swagger` khi dùng profile Development. Next.js dùng cache `.next-dev` riêng trong chế độ dev, nên cần khởi động lại `npm run dev` sau khi cập nhật mã nguồn này. Nếu Docker Engine chưa chạy, hãy mở Docker Desktop trước khi dùng `docker compose`.

## API chính

| Endpoint | Công dụng | Quyền |
| --- | --- | --- |
| `POST /api/admin/auth/login` | Đăng nhập bằng `{ "password": "..." }`, nhận cookie HttpOnly | Công khai |
| `GET /api/admin/auth/me`, `POST /api/admin/auth/logout` | Kiểm tra phiên, đăng xuất | Admin |
| `GET /api/locations`, `GET /api/combo-dates`, `GET /api/vouchers` | Dữ liệu chọn trong wizard | Công khai |
| `POST/PUT/DELETE /api/locations/{id?}` | Quản lý địa điểm | Admin |
| `POST/PUT/DELETE /api/combo-dates/{id?}` | Quản lý combo | Admin |
| `POST/PUT/DELETE /api/vouchers/{id?}` | Quản lý voucher | Admin |
| `GET/PUT /api/couple-profile` | Xem/chỉnh hồ sơ cặp đôi | Xem công khai, sửa admin |
| `POST /api/date-events` | Gửi thư mời, lưu Pending và gửi email | Công khai |
| `POST /api/date-events/reject` | Veto kế hoạch trước khi gửi, lưu Rejected | Công khai |
| `PUT /api/date-events/{id}/reschedule` | Đổi lịch, bắt buộc lý do, gửi email mới | Công khai |
| `GET /api/date-events?status=Pending,Rejected` | Danh sách quản trị | Admin |
| `GET /api/date-events/planned`, `GET /api/date-events/upcoming`, `GET /api/date-events/completed` | Kế hoạch đang chờ/đã duyệt, countdown và timeline kỷ niệm | Công khai |
| `POST /api/date-events/{id}/complete` | Đánh dấu hoàn thành | Admin |
| `PUT /api/date-events/{id}/memories` | Lưu ảnh URL, review, emoji cho lịch Completed | Công khai |
| `POST /api/uploads/image` | Upload JPEG/PNG/WebP tối đa 5 MB | Công khai |
| `GET /api/rsvp/confirm`, `POST /api/rsvp/respond` | Xác nhận và trả lời thư mời | Token RSVP |
| `POST /api/date-events/{id}/resend` | Gửi lại email nếu SMTP lỗi | Admin |

Lệnh `POST /api/date-events` và đổi lịch trả `{ dateEvent, emailSent }`. Khi dữ liệu đã lưu nhưng SMTP lỗi, API trả `202` với `emailSent: false`; dùng endpoint `resend` sau khi sửa cấu hình SMTP. Các request CRUD admin từ Next.js cần `credentials: 'include'`.

## Cấu hình local

Trước khi chạy Docker Compose, tạo file `.env` ở thư mục gốc với `ADMIN_PASSWORD` riêng (xem `.env.example`). Với `dotnet run`, đặt biến môi trường `Admin__Password` hoặc cấu hình local trong `backend/CuteDatingScheduler.Api/appsettings.Development.json`; file local này được Git bỏ qua. Đặt email nhận trong `Email__To`; SMTP local mặc định dùng Mailpit. Nếu triển khai nhiều instance, cần lưu Data Protection key ring dùng chung để các liên kết RSVP tiếp tục hợp lệ sau khi khởi động lại.

Ảnh upload hiện được lưu trong `backend/CuteDatingScheduler.Api/wwwroot/uploads`; môi trường deploy cần gắn persistent volume hoặc thay bằng object storage.
