`use client`
import { useState, useEffect } from 'react';

export function useReviews(productId) {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب التقييمات من WooCommerce
  const fetchReviews = async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // جلب التقييمات مع التقييمات المعلقة
      const response = await fetch(`/api/reviews?product_id=${productId}&per_page=20&include_pending=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في جلب التقييمات');
      }

      // تحديث البيانات وفقاً لصيغة API الجديد
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
  };

  // إرسال تقييم جديد
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

      // إضافة التقييم مؤقتاً للقائمة لعرضه فوراً
      const tempReview = {
        id: `temp_${Date.now()}`,
        product_id: productId,
        rating: reviewData.rating,
        review: reviewData.comment,
        reviewer: reviewData.reviewer_name,
        reviewer_email: reviewData.reviewer_email,
        date_created: new Date().toISOString(),
        status: 'pending',
        verified: false
      };

      // تحديث القائمة مؤقتاً
      setReviews(prev => [tempReview, ...prev]);

      // تحديث الإحصائيات
      const newTotal = reviewStats.total + 1;
      const newSum = (reviewStats.average * reviewStats.total) + reviewData.rating;
      const newAverage = newSum / newTotal;
      const newBreakdown = { ...reviewStats.breakdown };
      newBreakdown[reviewData.rating] = (newBreakdown[reviewData.rating] || 0) + 1;

      setReviewStats({
        total: newTotal,
        average: parseFloat(newAverage.toFixed(1)),
        breakdown: newBreakdown
      });

      // إعادة جلب التقييمات بعد 3 ثوان للتحديث الحقيقي
      setTimeout(fetchReviews, 3000);

      return {
        success: true,
        message: data.message || 'تم إرسال التقييم بنجاح'
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

  // تشغيل جلب التقييمات عند تحميل المكون
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  return {
    reviews,
    reviewStats,
    loading,
    error,
    submitReview,
    formatDate,
    refetch: fetchReviews
  };
}