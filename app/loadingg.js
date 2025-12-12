export default function Loading() {
  return (<>
     <style>{`
.product-skeleton {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  animation: pulse 1.4s infinite ease-in-out;
}

.product-skeleton .img {
  width: 100%;
  height: 180px;
  border-radius: 10px;
  background: #e3e3e3;
}

.product-skeleton .info {
  margin-top: 12px;
}

.product-skeleton .line {
  height: 14px;
  background: #e3e3e3;
  border-radius: 8px;
  margin-bottom: 10px;
}

.product-skeleton .line.short {
  width: 70%;
}

.product-skeleton .line.small {
  width: 40%;
  height: 12px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
  100% {
    opacity: 1;
  }
}


     `}</style>
    <div className="product-skeleton">
      <div className="img"></div>
      <div className="info">
        <div className="line short"></div>
        <div className="line"></div>
        <div className="line small"></div>
      </div>
    </div>
  </>

  );
}
