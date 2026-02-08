SS# Yumi Bot

Một chatbot Facebook Messenger được hỗ trợ bởi AI. Yumi Bot kết nối với Messenger thông qua [meta-messenger.js](https://github.com/nicejs-is-cool/meta-messenger.js) và sử dụng API tương thích OpenAI để tạo ra các phản hồi thông minh — bao gồm tìm kiếm web, thông dịch mã và nhận diện hình ảnh.

## Tính năng

- **Trò chuyện được hỗ trợ bởi AI** — nhắc tên bot hoặc sử dụng lệnh để trò chuyện với AI agent
- **Hỗ trợ tin nhắn mã hóa đầu cuối (E2EE)**
- **Hệ thống lệnh dựa trên tiền tố** với danh mục, bí danh và dễ dàng mở rộng
- **Nhận diện hình ảnh** — gửi hình ảnh và bot có thể phân tích chúng
- **Công cụ tìm kiếm web & trình thông dịch mã** khả dụng cho AI agent
- **Lịch sử hội thoại theo từng người dùng** với bộ nhớ đệm prompt

## Yêu cầu

- [Node.js](https://nodejs.org/) **v22.12.0** trở lên
- Tài khoản Facebook với cookies phiên hợp lệ được xuất dưới dạng JSON
- Khóa API tương thích OpenAI (OpenAI, hoặc bất kỳ nhà cung cấp tương thích nào trừ Azure)

## Cài đặt

### 1. Clone kho mã nguồn

```bash
git clone https://github.com/yumi-team/yumi-bot.git
cd yumi-bot
```

### 2. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục gốc của dự án:

```env
# Bot
BOT_PREFIX=!
DEBUG=yumi-bot:*

# Nhà cung cấp AI (tương thích OpenAI)
API_KEY=khóa-api-của-bạn
BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o

# Cookies
COOKIE_FILE_PATH=cookies.json
```

| Biến               | Mô tả                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| `BOT_PREFIX`       | Tiền tố cho các lệnh bot (ví dụ: `!ping`)                                          |
| `DEBUG`            | Bộ lọc namespace debug cho đầu ra log                                              |
| `API_KEY`          | Khóa API tương thích OpenAI của bạn                                                |
| `BASE_URL`         | URL gốc của API nhà cung cấp AI                                                    |
| `MODEL_NAME`       | Mô hình AI được sử dụng cho các phản hồi                                           |
| `COOKIE_FILE_PATH` | Đường dẫn đến file cookies Facebook dạng JSON (tương đối so với thư mục gốc dự án) |

### 4. Thêm cookies Facebook

Xuất cookies phiên Facebook của bạn dưới dạng JSON và lưu vào file `cookies.json` trong thư mục gốc dự án. File này cần chứa một mảng các đối tượng cookie được xuất từ tiện ích mở rộng trình duyệt như [EditThisCookie](https://www.editthiscookie.com/), [J2Team Cookie](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco) hoặc [Cookie-Editor](https://cookie-editor.com/).

Nếu bạn dùng [J2Team Cookie](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco), sau khi lưu cookies, hãy thay đổi code ở file
`Bot.ts` từ:

```ts
const cookies = Utils.parseCookies(JSON.parse(cookiesString));

super(cookies);
```

thành:

```ts
const rawCookies = JSON.parse(cookiesString);
const cookies = Utils.parseCookies(rawCookies.cookies);

super(cookies);
```

### 5. Chạy bot

**Phát triển** (với tự động tải lại):

```bash
npm run dev
```

**Sản phẩm**:

```bash
npm start
```

## Lệnh

Các lệnh được tổ chức theo danh mục bên trong `src/commands/`. Mỗi thư mục con đại diện cho một danh mục.

| Lệnh     | Bí danh | Mô tả                               |
| -------- | ------- | ----------------------------------- |
| `ping`   | `p`     | Kiểm tra độ trễ của bot             |
| `uptime` | —       | Hiển thị thời gian bot đã hoạt động |

### Tạo lệnh mới

Tạo file `.ts` mới bên trong thư mục danh mục dưới `src/commands/`:

```ts
import { Bot } from "@/classes/Bot";

export default Bot.createCommand({
    name: "hello",
    aliases: ["hi"],
    run: async ({ message, reply }) => {
        reply("Xin chào!");
    },
});
```

## Trò chuyện AI

Nhắc tên bot trong bất kỳ cuộc hội thoại nào để kích hoạt phản hồi AI. Bot hỗ trợ tin nhắn văn bản và tệp đính kèm hình ảnh. Lịch sử hội thoại được duy trì theo từng người dùng với bộ nhớ đệm prompt tự động.

## Cấu trúc dự án

```
src/
├── index.ts            # Điểm khởi đầu
├── agent/              # AI agent tương thích OpenAI
├── classes/            # Lớp client Bot
├── commands/           # Các file lệnh được tổ chức theo danh mục
│   ├── debug/          # Lệnh gỡ lỗi (ping, uptime)
│   └── info/           # Lệnh thông tin
├── events/             # Trình lắng nghe sự kiện (message, e2eeMessage)
├── handlers/           # Trình tải handler lệnh & sự kiện
├── typings/            # Khai báo kiểu TypeScript
└── utils/              # Hàm tiện ích (logger, import helper)
```

## Các lệnh script

| Script               | Mô tả                                             |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Khởi chạy ở chế độ phát triển với tự động tải lại |
| `npm start`          | Biên dịch và chạy cho môi trường sản phẩm         |
| `npm run lint`       | Chạy ESLint                                       |
| `npm run lint:fix`   | Chạy ESLint với tự động sửa lỗi                   |
| `npm run format`     | Kiểm tra định dạng với Prettier                   |
| `npm run format:fix` | Tự động định dạng với Prettier                    |

## Giấy phép

Dự án này được cấp phép theo [Giấy phép Công cộng GNU Affero phiên bản 3.0](LICENSE).
