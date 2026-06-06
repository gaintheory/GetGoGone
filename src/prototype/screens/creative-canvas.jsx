import React from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KImage, Transformer, Shape, Circle } from 'react-konva';
import { CreativeBuilderData } from './creative-templates';

// ─── helpers ─────────────────────────────────────────────────────────────────

function resolvePhotoSrc(l, vehicle) {
  if (l.src) return l.src;
  if (!vehicle) return null;
  if (typeof l.index === 'number') {
    if (Array.isArray(vehicle.images) && vehicle.images[l.index]) return vehicle.images[l.index];
    if (Array.isArray(vehicle.photosList) && vehicle.photosList[l.index]) return vehicle.photosList[l.index];
    if (l.index === 0 && vehicle.imageUrl) return vehicle.imageUrl;
    return vehicle.imageUrl || null;
  }
  return vehicle.imageUrl || null;
}

function useKonvaImage(src) {
  const [img, setImg] = React.useState(null);
  React.useEffect(() => {
    if (!src) { setImg(null); return; }
    let cancelled = false;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { if (!cancelled) setImg(image); };
    image.onerror = () => { if (!cancelled) setImg(null); };
    image.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return img;
}

// Returns {x, y, width, height, crop?} for objectFit simulation
function fitImage(imgW, imgH, boxW, boxH, fit) {
  if (!imgW || !imgH) return { width: boxW, height: boxH };
  const imgA = imgW / imgH;
  const boxA = boxW / boxH;

  if (fit === 'contain') {
    if (imgA > boxA) {
      const dh = boxW / imgA;
      return { x: 0, y: (boxH - dh) / 2, width: boxW, height: dh };
    }
    const dw = boxH * imgA;
    return { x: (boxW - dw) / 2, y: 0, width: dw, height: boxH };
  }

  // cover (default)
  if (imgA > boxA) {
    const dw = boxH * imgA;
    const offX = (dw - boxW) / 2;
    return {
      crop: { x: offX / dw * imgW, y: 0, width: boxW / dw * imgW, height: imgH },
      width: boxW, height: boxH,
    };
  }
  const dh = boxW / imgA;
  const offY = (dh - boxH) / 2;
  return {
    crop: { x: 0, y: offY / dh * imgH, width: imgW, height: boxH / dh * imgH },
    width: boxW, height: boxH,
  };
}

// ─── main canvas ─────────────────────────────────────────────────────────────

function CBCanvas({ width, height, layers, vars, vehicle, selectedId, onSelect, onLayerChange, onSnapshot, brand, scale = 1, interactive = true, stageRef: externalStageRef }) {
  const W = width;
  const H = height;
  const internalStageRef = React.useRef(null);
  const stageRef = externalStageRef || internalStageRef;
  const trRef = React.useRef(null);
  const nodeRefs = React.useRef({});

  React.useEffect(() => {
    if (!trRef.current || !interactive) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    trRef.current.nodes(node ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, interactive]);

  return (
    <div style={{
      width: W * scale, height: H * scale, flexShrink: 0,
      boxShadow: '0 1px 3px rgba(15,23,42,0.08), 0 12px 30px -10px rgba(15,23,42,0.18)',
      border: '1px solid var(--border)',
    }}>
      <Stage
        ref={stageRef}
        width={W * scale}
        height={H * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => { if (e.target === e.target.getStage()) onSelect?.(null); }}
      >
        <Layer>
          {layers.map(l => (
            <LayerNode
              key={l.id}
              l={l} W={W} H={H}
              vars={vars} vehicle={vehicle} brand={brand}
              interactive={interactive}
              selected={interactive && l.id === selectedId}
              onSelect={onSelect}
              onLayerChange={onLayerChange}
              onSnapshot={onSnapshot}
              setRef={(node) => {
                if (node) nodeRefs.current[l.id] = node;
                else delete nodeRefs.current[l.id];
              }}
            />
          ))}
          {interactive && (
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              keepRatio={false}
              anchorSize={8}
              anchorCornerRadius={2}
              anchorFill="#ffffff"
              anchorStroke="#2563EB"
              anchorStrokeWidth={1.5}
              borderStroke="#2563EB"
              borderStrokeWidth={1.5}
              padding={1}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

// ─── layer router ─────────────────────────────────────────────────────────────

function LayerNode({ l, W, H, vars, vehicle, brand, interactive, selected, onSelect, onLayerChange, onSnapshot, setRef }) {
  const { substitute } = CreativeBuilderData;
  const canInteract = interactive && !l.locked && l.type !== 'bg';

  const px = l.x / 100 * W;
  const py = l.y / 100 * H;
  const pw = l.w / 100 * W;
  const ph = l.h / 100 * H;
  const fs = (l.size || 4) / 100 * W;

  const interact = canInteract ? {
    draggable: true,
    onDragStart: () => onSnapshot?.(),
    onDragMove: (e) => onLayerChange?.(l.id, {
      x: Math.max(-5, Math.min(105, e.target.x() / W * 100)),
      y: Math.max(-5, Math.min(105, e.target.y() / H * 100)),
    }),
    onDragEnd: (e) => onLayerChange?.(l.id, {
      x: Math.max(-5, Math.min(105, e.target.x() / W * 100)),
      y: Math.max(-5, Math.min(105, e.target.y() / H * 100)),
    }),
    onTransformStart: () => onSnapshot?.(),
    onTransformEnd: (e) => {
      const node = e.target;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onLayerChange?.(l.id, {
        x: node.x() / W * 100,
        y: node.y() / H * 100,
        w: Math.max(2, l.w * sx),
        h: Math.max(2, l.h * sy),
      });
    },
    onClick: () => onSelect?.(l.id),
    ref: setRef,
  } : {
    onClick: interactive && l.type !== 'bg' ? () => onSelect?.(l.id) : undefined,
    ref: interactive && l.type !== 'bg' ? setRef : undefined,
  };

  const base = { x: px, y: py, ...interact };

  switch (l.type) {
    case 'bg':
      return <Rect x={0} y={0} width={W} height={H} fill={l.color || '#fff'} listening={false}/>;

    case 'shape':
      return (
        <Rect
          {...base}
          width={pw} height={ph}
          fill={l.color || '#000'}
          opacity={l.opacity ?? 1}
          stroke={l.border ? 'rgba(0,0,0,0.1)' : undefined}
          strokeWidth={l.border ? 1 : 0}
        />
      );

    case 'photo':
      return <PhotoLayer l={l} vehicle={vehicle} x={px} y={py} w={pw} h={ph} interact={interact}/>;

    case 'text': {
      const text = substitute(l.text || '', vars);
      if (l.pad) {
        return (
          <Group {...base} width={pw} height={ph}>
            <Rect width={pw} height={ph} fill={l.bg || '#DC2626'} cornerRadius={W * 0.003}/>
            <Text
              x={pw * 0.04} y={0}
              width={pw * 0.92} height={ph}
              text={text}
              fontSize={fs}
              fontFamily="Inter, -apple-system, sans-serif"
              fontStyle={String(l.weight || 600)}
              fill={l.color || '#fff'}
              align={l.align || 'left'}
              verticalAlign="middle"
              wrap="word"
              letterSpacing={l.letterSpacing ? l.letterSpacing * fs : 0}
              textDecoration={l.strike ? 'line-through' : ''}
              listening={false}
            />
          </Group>
        );
      }
      return (
        <Text
          {...base}
          width={pw} height={ph}
          text={text}
          fontSize={fs}
          fontFamily="Inter, -apple-system, sans-serif"
          fontStyle={String(l.weight || 600)}
          fill={l.color || '#0F172A'}
          align={l.align || 'left'}
          verticalAlign="middle"
          wrap="word"
          letterSpacing={l.letterSpacing ? l.letterSpacing * fs : 0}
          textDecoration={l.strike ? 'line-through' : ''}
        />
      );
    }

    case 'ribbon':
      return (
        <Group {...base} width={pw} height={ph}>
          <Shape
            sceneFunc={(ctx, shape) => {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(pw, 0);
              ctx.lineTo(pw * 0.95, ph / 2);
              ctx.lineTo(pw, ph);
              ctx.lineTo(0, ph);
              ctx.closePath();
              ctx.fillStrokeShape(shape);
            }}
            fill={l.color || '#DC2626'}
            width={pw} height={ph}
            listening={false}
          />
          <Text
            x={pw * 0.04} y={0}
            width={pw * 0.88} height={ph}
            text={l.text || ''}
            fontSize={Math.max(ph * 0.4, 8)}
            fontFamily="Inter, -apple-system, sans-serif"
            fontStyle="800"
            fill={l.textColor || '#fff'}
            align="left"
            verticalAlign="middle"
            letterSpacing={Math.max(ph * 0.4, 8) * 0.1}
            listening={false}
          />
        </Group>
      );

    case 'stat-row':
      return <StatRowLayer l={l} vars={vars} x={px} y={py} w={pw} h={ph} W={W} interact={interact}/>;

    case 'cta': {
      const text = substitute(l.text || '', vars);
      return (
        <Group {...base} width={pw} height={ph}>
          <Rect width={pw} height={ph} fill={l.bg || '#2563EB'} cornerRadius={W * 0.004}/>
          <Text
            width={pw} height={ph}
            text={text}
            fontSize={Math.max(ph * 0.38, W * 0.024)}
            fontFamily="Inter, -apple-system, sans-serif"
            fontStyle="700"
            fill={l.color || '#fff'}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      );
    }

    case 'logo':
      return <LogoLayer l={l} x={px} y={py} w={pw} h={ph} W={W} interact={interact}/>;

    case 'qr':
      return <QRLayer l={l} x={px} y={py} w={pw} h={ph} W={W} interact={interact}/>;

    case 'image-gen':
      return <ImageGenLayer l={l} x={px} y={py} w={pw} h={ph} interact={interact}/>;

    default:
      return null;
  }
}

// ─── photo layer ─────────────────────────────────────────────────────────────

function PhotoLayer({ l, vehicle, x, y, w, h, interact }) {
  const src = resolvePhotoSrc(l, vehicle);
  const img = useKonvaImage(src);
  const fitProps = img
    ? fitImage(img.naturalWidth || img.width, img.naturalHeight || img.height, w, h, l.fit || 'cover')
    : { width: w, height: h };

  return (
    <Group x={x} y={y} width={w} height={h} clipFunc={(ctx) => ctx.rect(0, 0, w, h)} {...interact}>
      <Rect width={w} height={h} fill="#CBD5E1" listening={false}/>
      {img && (
        <KImage
          image={img}
          x={fitProps.x || 0}
          y={fitProps.y || 0}
          width={fitProps.width || w}
          height={fitProps.height || h}
          crop={fitProps.crop}
          listening={false}
        />
      )}
      {l.mask === 'darken' && (
        <Rect
          width={w} height={h}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: h }}
          fillLinearGradientColorStops={[0, 'rgba(0,0,0,0.2)', 1, 'rgba(0,0,0,0.6)']}
          listening={false}
        />
      )}
      {l.mask === 'fade-left' && (
        <Rect
          width={w} height={h}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: w * 0.35, y: 0 }}
          fillLinearGradientColorStops={[0, 'rgba(127,29,29,0.85)', 1, 'rgba(0,0,0,0)']}
          listening={false}
        />
      )}
    </Group>
  );
}

// ─── stat-row layer ───────────────────────────────────────────────────────────

function StatRowLayer({ l, vars, x, y, w, h, W, interact }) {
  const { substitute } = CreativeBuilderData;
  const items = l.items || [];
  const cols = items.length;
  const gap = W * 0.005;
  const colW = (w - gap * (cols - 1)) / cols;
  const labelFs = Math.max(1.6 / 100 * W, 9);
  const valueFs = Math.max(3.2 / 100 * W, 13);
  const cornerR = W * 0.004;

  return (
    <Group x={x} y={y} width={w} height={h} {...interact}>
      {items.map((item, i) => {
        const hi = !!item.highlight;
        const bg = hi ? '#DC2626' : (l.bg || '#1E293B');
        const fg = hi ? '#fff' : (l.color || '#fff');
        const value = substitute(item.value || '', vars);
        const cx = i * (colW + gap);

        return (
          <Group key={i} x={cx} listening={false}>
            <Rect
              width={colW} height={h}
              fill={bg}
              cornerRadius={cornerR}
              stroke={l.border && !hi ? '#E2E8F0' : undefined}
              strokeWidth={l.border && !hi ? 1 : 0}
            />
            <Text
              x={colW * 0.06} y={h * 0.1}
              width={colW * 0.88} height={h * 0.38}
              text={item.label || ''}
              fontSize={labelFs}
              fontFamily="Inter, -apple-system, sans-serif"
              fontStyle="700"
              fill={fg}
              opacity={0.65}
              letterSpacing={labelFs * 0.1}
              align="left"
              verticalAlign="middle"
            />
            <Text
              x={colW * 0.06} y={h * 0.48}
              width={colW * 0.88} height={h * 0.5}
              text={value}
              fontSize={valueFs}
              fontFamily="Inter, -apple-system, sans-serif"
              fontStyle="800"
              fill={fg}
              align="left"
              verticalAlign="middle"
            />
          </Group>
        );
      })}
    </Group>
  );
}

// ─── logo layer ───────────────────────────────────────────────────────────────

function LogoLayer({ l, x, y, w, h, W, interact }) {
  const light = l.color === 'light';
  const bg = light ? '#fff' : '#111827';
  const fg = light ? '#111' : '#fff';
  const logoFs = h * 0.52;
  const dotR = h * 0.09;
  const halfW = w / 2;

  return (
    <Group x={x} y={y} width={w} height={h} {...interact}>
      <Rect width={w} height={h} fill={bg} cornerRadius={W * 0.004}/>
      <Text
        x={0} y={0}
        width={halfW - dotR - w * 0.04}
        height={h}
        text="G"
        fontSize={logoFs}
        fontFamily="Inter, -apple-system, sans-serif"
        fontStyle="800"
        fill={fg}
        align="right"
        verticalAlign="middle"
        listening={false}
      />
      <Circle x={halfW} y={h / 2} radius={dotR} fill="#F59E0B" listening={false}/>
      <Text
        x={halfW + dotR + w * 0.02}
        y={0}
        width={halfW - dotR - w * 0.04}
        height={h}
        text="G"
        fontSize={logoFs}
        fontFamily="Inter, -apple-system, sans-serif"
        fontStyle="800"
        fill={fg}
        align="left"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}

// ─── qr layer ─────────────────────────────────────────────────────────────────

function QRLayer({ l, x, y, w, h, W, interact }) {
  const labelFs = Math.max(1.4 / 100 * W, 8);
  const qrS = h * 0.62;
  const qrX = (w - qrS) / 2;
  const qrY = h * 0.08;
  const sq = qrS * 0.22;

  return (
    <Group x={x} y={y} width={w} height={h} {...interact}>
      <Rect width={w} height={h} fill="#fff" stroke="#000" strokeWidth={2}/>
      <Rect x={qrX} y={qrY} width={qrS} height={qrS} fill="#000" listening={false}/>
      <Rect x={qrX + qrS * 0.06} y={qrY + qrS * 0.06} width={qrS * 0.88} height={qrS * 0.88} fill="#fff" listening={false}/>
      {/* corner finder squares */}
      <Rect x={qrX + qrS * 0.08} y={qrY + qrS * 0.08} width={sq} height={sq} fill="#000" listening={false}/>
      <Rect x={qrX + qrS * 0.7} y={qrY + qrS * 0.08} width={sq} height={sq} fill="#000" listening={false}/>
      <Rect x={qrX + qrS * 0.08} y={qrY + qrS * 0.7} width={sq} height={sq} fill="#000" listening={false}/>
      {/* center data dots */}
      {[[0.4, 0.4],[0.52, 0.32],[0.62, 0.48],[0.44, 0.58],[0.56, 0.62]].map(([cx, cy], i) => (
        <Rect key={i} x={qrX + qrS * cx} y={qrY + qrS * cy} width={qrS * 0.06} height={qrS * 0.06} fill="#000" listening={false}/>
      ))}
      <Text
        x={0} y={qrY + qrS + h * 0.04}
        width={w} height={h * 0.18}
        text="SCAN FOR REPORT"
        fontSize={labelFs}
        fontFamily="Inter, -apple-system, sans-serif"
        fontStyle="900"
        fill="#000"
        align="center"
        verticalAlign="middle"
        letterSpacing={labelFs * 0.1}
        listening={false}
      />
    </Group>
  );
}

// ─── image-gen layer (ComfyUI generated) ─────────────────────────────────────

function ImageGenLayer({ l, x, y, w, h, interact }) {
  const img = useKonvaImage(l.src || null);

  return (
    <Group x={x} y={y} width={w} height={h} clipFunc={(ctx) => ctx.rect(0, 0, w, h)} {...interact}>
      {img ? (
        <KImage image={img} width={w} height={h} listening={false}/>
      ) : (
        <>
          <Rect
            width={w} height={h}
            fill="rgba(37,99,235,0.06)"
            stroke="#2563EB"
            strokeWidth={1.5}
            dash={[6, 3]}
          />
          <Text
            width={w} height={h}
            text={l.status === 'pending' ? 'Generating image…' : 'AI Image'}
            fontSize={Math.min(w, h) * 0.07}
            fontFamily="Inter, -apple-system, sans-serif"
            fontStyle="600"
            fill="#2563EB"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      )}
    </Group>
  );
}

export { CBCanvas };
