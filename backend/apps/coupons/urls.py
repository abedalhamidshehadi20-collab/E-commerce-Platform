from django.urls import path

from .views import CouponApplyAPIView, CouponListAPIView


urlpatterns = [
    path("coupons/", CouponListAPIView.as_view(), name="coupon-list"),
    path("coupons/apply/", CouponApplyAPIView.as_view(), name="coupon-apply"),
]
