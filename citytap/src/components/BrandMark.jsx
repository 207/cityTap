function BrandMark({ size = 32, className = '' }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={size}
      height={size}
      className={`brand-mark${className ? ` ${className}` : ''}`}
      draggable="false"
    />
  );
}

export default BrandMark;
