# Facebook Ads Scraper API

API để thu thập và phân tích quảng cáo Facebook.

## Tính năng

- Thu thập quảng cáo từ các trang Facebook
- Cache kết quả vào PostgreSQL để giảm số lượng yêu cầu API
- Phân tích nội dung quảng cáo bằng AI
- Phân tích hình ảnh quảng cáo bằng AI Vision
- Phân tích video quảng cáo với transcript

## Thiết lập

1. Clone repository
2. Cài đặt dependencies:
   ```
   npm install
   ```
3. Tạo file `.env` với các biến môi trường cần thiết:
   ```
   APIFY_API_TOKEN=your_apify_api_token
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=ads_spy
   DB_PORT=5432
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Khởi động server:
   ```
   npm run dev
   ```

## API Endpoints

### Lấy quảng cáo

```
POST /api/scrape
```

Body:
```json
{
  "pageUrl": "https://www.facebook.com/yourpage",
  "forceRefresh": false
}
```

### Xóa cache

```
DELETE /api/cache
```

Body:
```json
{
  "pageUrl": "https://www.facebook.com/yourpage"
}
```

### Lấy quảng cáo theo ID

```
GET /api/ads/:id
```

### Phân tích quảng cáo

```
POST /api/ai/analyze
```

Body:
```json
{
  "adId": "ad_id_from_database",
  "businessName": "Your Business Name",
  "industry": "Your Industry",
  "targetAudience": "Your Target Audience",
  "businessDescription": "Brief description of your business",
  "uniqueSellingPoints": ["USP 1", "USP 2", "USP 3"],
  "tone": "Friendly/Professional/Humorous/etc",
  "products": ["Product 1", "Product 2", "Service 1"]
}
```

Phân tích một quảng cáo với ID cụ thể và tạo phân tích cá nhân hóa dựa trên thông tin doanh nghiệp. Kết quả trả về bao gồm:
- Phân tích nội dung và template caption
- Phân tích hình ảnh với hướng dẫn thiết kế
- Phân tích video và kịch bản (nếu có)

## Xử lý Hình ảnh và Video

### Phân tích Hình ảnh

API sử dụng GPT-4o Vision để phân tích chi tiết tất cả các hình ảnh trong quảng cáo, bao gồm:
- Bố cục tổng thể
- Màu sắc chủ đạo và bảng màu
- Font chữ và text
- Đối tượng chính trong hình ảnh
- Góc chụp và bố cục
- Các yếu tố thiết kế nổi bật
- Cách điều chỉnh phù hợp với doanh nghiệp của người dùng

### Phân tích Video

API sẽ download video quảng cáo tạm thời, tạo transcript bằng AI Whisper, rồi phân tích nội dung để tạo kịch bản cá nhân hóa cho doanh nghiệp của người dùng, bao gồm:
- Cấu trúc tổng thể (intro, body, outro)
- Kịch bản thoại đầy đủ
- Mô tả các cảnh quay
- Hướng dẫn về âm nhạc và hiệu ứng
- Cách áp dụng phong cách cho doanh nghiệp cụ thể

## Cấu hình

Cấu hình được lưu trong thư mục `src/config`. 