import { GGG } from './data';

function VehicleMedia({ v, style, className, preserve = "cover", src, index }) {
  let imageSource = src;
  if (!imageSource && v) {
    if (typeof index === 'number') {
      if (Array.isArray(v.images) && v.images[index]) {
        imageSource = v.images[index];
      } else if (Array.isArray(v.photosList) && v.photosList[index]) {
        imageSource = v.photosList[index];
      } else if (index === 0) {
        imageSource = v.imageUrl;
      }
    } else {
      imageSource = v.imageUrl;
    }
  }

  if (imageSource) {
    return (
      <img
        src={imageSource}
        alt={v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"}
        className={className}
        style={{ width: "100%", height: "100%", objectFit: preserve, display: "block", ...style }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      dangerouslySetInnerHTML={{ __html: GGG.vehicleSvg(v?.body, v?.palette) }}
    />
  );
}

export { VehicleMedia };
