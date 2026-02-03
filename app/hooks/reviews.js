// app/hooks/reviews.js
import { useState, useEffect, useCallback } from 'react';

export function useReviews(productId) {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ⭐ دالة جلب التقييمات
  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ⭐ إضافة timestamp لمنع cache
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/reviews?product_id=${productId}&t=${timestamp}`,
        {
          cache: 'no-store', // منع cache في Next.js
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب التقييمات');
      }

      setReviews(data.reviews || []);
      setReviewStats(data.stats || {
        total: 0,
        average: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    } catch (err) {
      console.error('خطأ في جلب التقييمات:', err);
      setError(err.message || 'حدث خطأ في جلب التقييمات');
      setReviews([]);
      setReviewStats({
        total: 0,
        average: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // جلب التقييمات عند التحميل
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ⭐ دالة إرسال التقييم
  const submitReview = async (reviewData) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          reviewer_name: reviewData.reviewer_name,
          reviewer_email: reviewData.reviewer_email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إرسال التقييم');
      }

      // ⭐ المهم: تحديث التقييمات فوراً بعد النجاح
      await fetchReviews();

      return {
        success: true,
        message: data.message || 'تم إرسال تقييمك بنجاح'
      };
    } catch (error) {
      console.error('خطأ في إرسال التقييم:', error);
      throw new Error(error.message || 'حدث خطأ في إرسال التقييم');
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return 'اليوم';
      } else if (diffInDays === 1) {
        return 'أمس';
      } else if (diffInDays < 7) {
        return `منذ ${diffInDays} أيام`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `منذ ${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
      } else {
        const years = Math.floor(diffInDays / 365);
        return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`;
      }
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return '';
    }
  };

  return {
    reviews,
    reviewStats,
    loading,
    error,
    submitReview,
    formatDate,
    refetch: fetchReviews, // لو تبي تحدّث يدوياً
  };
}