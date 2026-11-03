'use client';

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export default function ReviewForm({ isOpen, onClose, onSubmit, isSubmitting, productName }) {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    reviewer_name: '',
    reviewer_email: ''
  });
  const [errors, setErrors] = useState({});
  const [hoveredRating, setHoveredRating] = useState(0);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = 'يرجى اختيار تقييم';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'يرجى كتابة تعليق';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'التعليق يجب أن يكون 10 أحرف على الأقل';
    }

    if (!formData.reviewer_name.trim()) {
      newErrors.reviewer_name = 'يرجى إدخال اسمك';
    }

    if (!formData.reviewer_email.trim()) {
      newErrors.reviewer_email = 'يرجى إدخال بريدك الإلكتروني';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.reviewer_email)) {
        newErrors.reviewer_email = 'البريد الإلكتروني غير صحيح';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);

      // إعادة تعيين النموذج عند النجاح
      setFormData({
        rating: 0,
        comment: '',
        reviewer_name: '',
        reviewer_email: ''
      });
      setErrors({});
    } catch (error) {
      // التعامل مع الأخطاء يتم في المكون الأب
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // إزالة الخطأ عند البدء بالكتابة
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleRatingClick = (rating) => {
    handleInputChange('rating', rating);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        rating: 0,
        comment: '',
        reviewer_name: '',
        reviewer_email: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reviewFormOverlay">
      <div className="reviewFormModal">
        <div className="reviewFormHeader">
          <h3>تقييم المنتج</h3>
          <button
            onClick={handleClose}
            className="reviewFormClose"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="reviewFormContent">
          <div className="productInfo">
            <h4>{productName}</h4>
          </div>

          <form onSubmit={handleSubmit} className="reviewForm">
            {/* تقييم النجوم */}
            <div className="formGroup">
              <label className="formLabel">التقييم *</label>
              <div className="ratingInput">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="ratingButton"
                  >
                    <Star
                      className={`ratingStar ${
                        star <= (hoveredRating || formData.rating) ? 'filled' : 'empty'
                      }`}
                    />
                  </button>
                ))}
                <span className="ratingText">
                  {formData.rating > 0 && (
                    <>
                      {formData.rating === 1 && 'سيء جداً'}
                      {formData.rating === 2 && 'سيء'}
                      {formData.rating === 3 && 'مقبول'}
                      {formData.rating === 4 && 'جيد'}
                      {formData.rating === 5 && 'ممتاز'}
                    </>
                  )}
                </span>
              </div>
              {errors.rating && <span className="formError">{errors.rating}</span>}
            </div>

            {/* التعليق */}
            <div className="formGroup">
              <label htmlFor="comment" className="formLabel">التعليق *</label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                placeholder="شاركنا رأيك في المنتج..."
                rows={4}
                className={`formTextarea ${errors.comment ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              <div className="commentLength">
                {formData.comment.length}/500
              </div>
              {errors.comment && <span className="formError">{errors.comment}</span>}
            </div>

            {/* الاسم */}
            <div className="formGroup">
              <label htmlFor="reviewer_name" className="formLabel">الاسم *</label>
              <input
                type="text"
                id="reviewer_name"
                value={formData.reviewer_name}
                onChange={(e) => handleInputChange('reviewer_name', e.target.value)}
                placeholder="اسمك الكامل"
                className={`formInput ${errors.reviewer_name ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.reviewer_name && <span className="formError">{errors.reviewer_name}</span>}
            </div>

            {/* البريد الإلكتروني */}
            <div className="formGroup">
              <label htmlFor="reviewer_email" className="formLabel">البريد الإلكتروني *</label>
              <input
                type="email"
                id="reviewer_email"
                value={formData.reviewer_email}
                onChange={(e) => handleInputChange('reviewer_email', e.target.value)}
                placeholder="example@email.com"
                className={`formInput ${errors.reviewer_email ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.reviewer_email && <span className="formError">{errors.reviewer_email}</span>}
            </div>

            {/* أزرار الإجراءات */}
            <div className="formActions">
              <button
                type="button"
                onClick={handleClose}
                className="cancelButton"
                disabled={isSubmitting}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="submitButton"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}