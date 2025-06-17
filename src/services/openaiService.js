const OpenAI = require('openai');
const config = require('../config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const openai = new OpenAI({ apiKey: config.OPENAI.API_KEY });

/**
 * Phân tích nội dung quảng cáo và tạo template caption
 * @param {Object} ad Thông tin quảng cáo
 * @param {Object} businessContext Thông tin doanh nghiệp
 * @returns {Promise<Object>} Template caption
 */
const analyzeAdContent = async (ad, businessContext = {}) => {
  try {
    const prompt = `
Phân tích và tạo template quảng cáo dựa trên quảng cáo sau:

Nội dung quảng cáo (caption):
${ad.text}

CTA (Call-to-Action): ${ad.ctaText || 'Không có'}
Loại CTA: ${ad.ctaType || 'Không có'}
Loại media: ${ad.mediaType || 'Không có'}

THÔNG TIN DOANH NGHIỆP:
Tên doanh nghiệp: ${businessContext.businessName || 'Không xác định'}
Ngành nghề: ${businessContext.industry || 'Không xác định'}
Đối tượng mục tiêu: ${businessContext.targetAudience || 'Không xác định'}
Mô tả doanh nghiệp: ${businessContext.businessDescription || 'Không có mô tả'}
Điểm bán hàng độc đáo (USP): ${Array.isArray(businessContext.uniqueSellingPoints) ? businessContext.uniqueSellingPoints.join(', ') : businessContext.uniqueSellingPoints || 'Không xác định'}
Giọng điệu: ${businessContext.tone || 'Thân thiện'}
Sản phẩm/Dịch vụ: ${Array.isArray(businessContext.products) ? businessContext.products.join(', ') : businessContext.products || 'Không xác định'}

Yêu cầu:
1. Phân tích cấu trúc và cách viết của caption trên
2. Tạo template caption mới dựa trên phong cách của caption ban đầu, nhưng được điều chỉnh phù hợp với thông tin doanh nghiệp được cung cấp
3. Sử dụng các thông tin doanh nghiệp đã cung cấp để cá nhân hóa template (thay vì dùng placeholder chung chung)
4. Đảm bảo giữ nguyên phong cách ngôn ngữ, tone, cấu trúc của caption gốc
5. Liệt kê các thành phần chính của caption: lời mở đầu, thân bài, call-to-action, thông tin liên hệ (nếu có)
6. Tạo hướng dẫn chi tiết về cách sử dụng template này hiệu quả

Trả về kết quả theo format JSON sau:
{
  "analysis": "Phân tích ngắn gọn về quảng cáo gốc",
  "template": "Template caption hoàn chỉnh với thông tin doanh nghiệp cụ thể",
  "components": {
    "intro": "Phần mở đầu của template",
    "body": "Phần thân của template",
    "benefits": "Các lợi ích/tính năng nếu có",
    "cta": "Call-to-action",
    "contact": "Phần thông tin liên hệ nếu có"
  },
  "guidelines": "Hướng dẫn sử dụng template"
}`;

    const response = await openai.chat.completions.create({
      model: config.OPENAI.MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là một chuyên gia phân tích và tạo nội dung quảng cáo, đặc biệt là quảng cáo Facebook. Trả về nội dung ở định dạng JSON theo yêu cầu.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing ad content:', error);
    throw new Error('Failed to analyze ad content');
  }
};

/**
 * Phân tích hình ảnh quảng cáo sử dụng model vision
 * @param {Object} ad Thông tin quảng cáo
 * @param {Object} businessContext Thông tin doanh nghiệp
 * @returns {Promise<Object>} Phân tích hình ảnh
 */
const analyzeAdImages = async (ad, businessContext = {}) => {
  try {
    if (ad.mediaType !== 'image' && ad.mediaType !== 'mixed') {
      return { analysis: "Không có hình ảnh để phân tích" };
    }

    // Lọc tất cả các hình ảnh từ media array
    const imagesToAnalyze = ad.media
      .filter(url => url.match(/\.(jpeg|jpg|png|webp)/) !== null);

    if (imagesToAnalyze.length === 0) {
      return { analysis: "Không tìm thấy hình ảnh phù hợp để phân tích" };
    }

    // Chuẩn bị business context text
    const businessContextText = `
THÔNG TIN DOANH NGHIỆP:
Tên doanh nghiệp: ${businessContext.businessName || 'Không xác định'}
Ngành nghề: ${businessContext.industry || 'Không xác định'}
Đối tượng mục tiêu: ${businessContext.targetAudience || 'Không xác định'}
Mô tả doanh nghiệp: ${businessContext.businessDescription || 'Không có mô tả'}
Điểm bán hàng độc đáo (USP): ${Array.isArray(businessContext.uniqueSellingPoints) ? businessContext.uniqueSellingPoints.join(', ') : businessContext.uniqueSellingPoints || 'Không xác định'}
Giọng điệu: ${businessContext.tone || 'Thân thiện'}
Sản phẩm/Dịch vụ: ${Array.isArray(businessContext.products) ? businessContext.products.join(', ') : businessContext.products || 'Không xác định'}`;

    // Chuẩn bị các messages cho Vision API với gpt-4o
    const messages = [
      {
        role: 'system',
        content: 'Bạn là một chuyên gia phân tích hình ảnh, nhiếp ảnh và thiết kế đồ họa. Phân tích chi tiết các hình ảnh quảng cáo được cung cấp. Hãy tập trung vào cách những hình ảnh này có thể áp dụng cho doanh nghiệp của người dùng. Trả về nội dung ở định dạng JSON theo yêu cầu.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Phân tích chi tiết các hình ảnh quảng cáo sau dựa trên thông tin doanh nghiệp được cung cấp. Hãy phân tích kỹ từng hình ảnh và đưa ra hướng dẫn cụ thể về cách tạo hình ảnh tương tự cho doanh nghiệp của người dùng.

${businessContextText}

Hãy phân tích các yếu tố sau và đưa ra hướng dẫn phù hợp với đặc thù doanh nghiệp của người dùng:

1. Bố cục tổng thể của các hình ảnh
2. Màu sắc chủ đạo và bảng màu được sử dụng
3. Font chữ và cách sử dụng text trong hình ảnh (nếu có)
4. Đối tượng chính trong hình ảnh (sản phẩm, người, phong cảnh, etc.)
5. Góc chụp, ánh sáng và bố cục
6. Các yếu tố thiết kế nổi bật
7. Hướng dẫn cụ thể để tạo ra hình ảnh tương tự cho doanh nghiệp của người dùng

Trả về kết quả theo format JSON sau:
{
  "layout": "Mô tả bố cục tổng thể",
  "colors": "Phân tích màu sắc và bảng màu",
  "typography": "Phân tích font chữ và văn bản (nếu có)",
  "subjects": "Đối tượng chính trong hình ảnh",
  "composition": "Góc chụp, ánh sáng và bố cục",
  "design_elements": "Các yếu tố thiết kế nổi bật",
  "industry_adaptation": "Cách thích ứng phong cách này cho doanh nghiệp ${businessContext.businessName || 'của người dùng'}",
  "guidelines": "Hướng dẫn cụ thể để tạo hình ảnh tương tự cho doanh nghiệp"
}`
          }
        ]
      }
    ];

    // Thêm tất cả hình ảnh vào messages
    for (const imageUrl of imagesToAnalyze) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: config.OPENAI.VISION_MODEL,
      max_tokens: 4096,
      messages: messages,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing ad images:', error);
    throw new Error('Failed to analyze ad images');
  }
};

/**
 * Tạo transcript từ video quảng cáo sử dụng Whisper API
 * @param {string} videoUrl URL của video quảng cáo
 * @returns {Promise<string>} Transcript của video
 */
const transcribeVideo = async (videoUrl) => {
  try {
    console.log(`Starting video transcription for: ${videoUrl}`);
    
    // Tải video
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'arraybuffer'
    });
    
    // Tạo tên file tạm thời
    const tempFilePath = path.join(__dirname, `../temp_${Date.now()}.mp4`);
    
    // Lưu video vào file tạm thời
    fs.writeFileSync(tempFilePath, response.data);
    
    console.log(`Video downloaded and saved to ${tempFilePath}`);
    
    // Sử dụng Whisper API để tạo transcript
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1"
    });
    
    // Xóa file tạm thời
    fs.unlinkSync(tempFilePath);
    
    console.log(`Video transcription completed and temp file removed`);
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw new Error('Failed to transcribe video');
  }
};

/**
 * Phân tích video quảng cáo
 * @param {Object} ad Thông tin quảng cáo
 * @param {Object} businessContext Thông tin doanh nghiệp
 * @returns {Promise<Object>} Phân tích video và kịch bản
 */
const analyzeAdVideo = async (ad, businessContext = {}) => {
  try {
    if (ad.mediaType !== 'video' && ad.mediaType !== 'mixed') {
      return { analysis: "Không có video để phân tích" };
    }

    // Lấy tất cả các video để phân tích
    const videoUrls = ad.media.filter(url => url.match(/\.mp4/) !== null);

    if (videoUrls.length === 0) {
      return { analysis: "Không tìm thấy video phù hợp để phân tích" };
    }

    // Tạo transcript từ tất cả các video
    let transcripts = [];
    for (const videoUrl of videoUrls) {
      try {
        const transcript = await transcribeVideo(videoUrl);
        transcripts.push({
          url: videoUrl,
          transcript: transcript
        });
      } catch (error) {
        console.error(`Error transcribing video ${videoUrl}:`, error);
        // Continue with other videos if one fails
      }
    }

    if (transcripts.length === 0) {
      return { analysis: "Không thể tạo transcript từ bất kỳ video nào" };
    }

    // Chuẩn bị nội dung từ các transcript
    const transcriptContent = transcripts.map((item, index) => 
      `Video ${index + 1}:\n${item.transcript}`
    ).join('\n\n');

    // Chuẩn bị business context text
    const businessContextText = `
THÔNG TIN DOANH NGHIỆP:
Tên doanh nghiệp: ${businessContext.businessName || 'Không xác định'}
Ngành nghề: ${businessContext.industry || 'Không xác định'}
Đối tượng mục tiêu: ${businessContext.targetAudience || 'Không xác định'}
Mô tả doanh nghiệp: ${businessContext.businessDescription || 'Không có mô tả'}
Điểm bán hàng độc đáo (USP): ${Array.isArray(businessContext.uniqueSellingPoints) ? businessContext.uniqueSellingPoints.join(', ') : businessContext.uniqueSellingPoints || 'Không xác định'}
Giọng điệu: ${businessContext.tone || 'Thân thiện'}
Sản phẩm/Dịch vụ: ${Array.isArray(businessContext.products) ? businessContext.products.join(', ') : businessContext.products || 'Không xác định'}`;

    const prompt = `
Phân tích video quảng cáo sau dựa trên thông tin doanh nghiệp được cung cấp:

${businessContextText}

Transcript của các video:
${transcriptContent}

Nội dung caption của quảng cáo:
${ad.text}

Hãy phân tích kỹ video quảng cáo dựa trên transcript và caption, và trả về một kịch bản video tương tự đã được điều chỉnh phù hợp với doanh nghiệp của người dùng. Cần đề cập đến:

1. Cấu trúc tổng thể của video (intro, body, outro)
2. Các cảnh quay chính và thời lượng ước tính
3. Script/thoại cho video
4. Hướng dẫn về âm nhạc và hiệu ứng âm thanh
5. Các chuyển cảnh và hiệu ứng hình ảnh
6. Hướng dẫn về text hiển thị trong video
7. Cách áp dụng cụ thể cho doanh nghiệp ${businessContext.businessName || 'của người dùng'}

Trả về kết quả theo format JSON sau:
{
  "overview": "Tổng quan về video",
  "structure": {
    "intro": "Mô tả phần mở đầu",
    "body": "Mô tả phần thân",
    "outro": "Mô tả phần kết thúc"
  },
  "script": "Kịch bản thoại hoàn chỉnh với các cảnh tương ứng đã điều chỉnh cho doanh nghiệp của người dùng",
  "scenes": [
    {
      "description": "Mô tả cảnh 1",
      "duration": "Thời lượng ước tính",
      "dialogue": "Thoại/script cho cảnh này",
      "visuals": "Hướng dẫn về hình ảnh"
    }
  ],
  "audio_guidelines": "Hướng dẫn về âm nhạc và hiệu ứng âm thanh",
  "visual_effects": "Hướng dẫn về hiệu ứng hình ảnh và chuyển cảnh",
  "text_overlays": "Hướng dẫn về text hiển thị trong video",
  "business_adaptation": "Cách áp dụng phong cách này cho doanh nghiệp ${businessContext.businessName || 'của người dùng'}"
}`;

    const response = await openai.chat.completions.create({
      model: config.OPENAI.MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là một chuyên gia phân tích và tạo kịch bản video quảng cáo. Trả về nội dung ở định dạng JSON theo yêu cầu.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing ad video:', error);
    throw new Error('Failed to analyze ad video');
  }
};

module.exports = {
  analyzeAdContent,
  analyzeAdImages,
  analyzeAdVideo
}; 