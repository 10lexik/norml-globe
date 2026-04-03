import * as THREE from 'three'
import { gsap } from 'gsap'

// Dimensions canvas texture globe
const MAP_W = 4096
const MAP_H = 2048

// Longitude/latitude → UV (projection équirectangulaire)
function geoToUV(lon: number, lat: number): [number, number] {
  return [
    (lon + 180) / 360,
    (90 - lat) / 180
  ]
}

// UV → pixels canvas
function uvToPixel(u: number, v: number, w: number, h: number): [number, number] {
  return [Math.round(u * w), Math.round(v * h)]
}

export function useGlobe(canvas: HTMLCanvasElement) {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let globe: THREE.Mesh
  let atmosphere: THREE.Mesh
  let starField: THREE.Points
  let colorCanvas: HTMLCanvasElement
  let colorCtx: CanvasRenderingContext2D
  let pickCanvas: HTMLCanvasElement
  let pickCtx: CanvasRenderingContext2D
  let colorTexture: THREE.CanvasTexture
  let isDragging = false
  let prevMouse = { x: 0, y: 0 }
  // Initial rotation on France (approx 2°E longitude)
  const FRANCE_LON = 2.2137
  const INITIAL_Y = ((-FRANCE_LON) * Math.PI) / 180 - (Math.PI / 2)
  let rotation = { x: 0.3, y: INITIAL_Y }
  let velocity = { x: 0, y: 0 }
  let geoData: any = null
  let countryMap: Record<number, string> = {}
  let hoveredCountry: string | null = null
  let onCountryClick: ((code: string | null) => void) | null = null
  let onCountryHover: ((code: string | null) => void) | null = null
  let animFrame: number
  let raycaster = new THREE.Raycaster()
  let mouse = new THREE.Vector2()
  let pickBuffer: ImageData | null = null
  let isPaused = true
  let focusTween: gsap.core.Tween | null = null

  let statusByCode: Record<string, string> = {}
  let colorsByStatus: Record<string, string> = {}
  let themeColors: Record<string, string> = {}
  let nameMap: Record<string, string> = {}

  function init(
    initialStatus: Record<string, string> = {},
    initialColors: Record<string, string> = {},
    initialTheme: Record<string, string> = {},
    initialNameMap: Record<string, string> = {}
  ) {
    statusByCode = initialStatus
    colorsByStatus = initialColors
    themeColors = initialTheme
    nameMap = initialNameMap

    scene = new THREE.Scene()
    const aspect = canvas.clientWidth / canvas.clientHeight
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    
    // Position initiale gérée par calculateLayout
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setClearColor(0x000000, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8)
    sunLight.position.set(5, 3, 5)
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x1a4030, 0.3)
    fillLight.position.set(-5, -2, -3)
    scene.add(fillLight)

    colorCanvas = document.createElement('canvas')
    colorCanvas.width = MAP_W
    colorCanvas.height = MAP_H
    colorCtx = colorCanvas.getContext('2d')!

    pickCanvas = document.createElement('canvas')
    pickCanvas.width = MAP_W
    pickCanvas.height = MAP_H
    pickCtx = pickCanvas.getContext('2d')!

    const defaultBg = themeColors['ocean'] || themeColors['nodata'] || '#0D1A17'
    colorCtx.fillStyle = defaultBg
    colorCtx.fillRect(0, 0, MAP_W, MAP_H)
    pickCtx.fillStyle = '#000000'
    pickCtx.fillRect(0, 0, MAP_W, MAP_H)

    colorTexture = new THREE.CanvasTexture(colorCanvas)
    const globeGeo = new THREE.SphereGeometry(1, 64, 64)
    const globeMat = new THREE.MeshPhongMaterial({ map: colorTexture, shininess: 0.5 })
    globe = new THREE.Mesh(globeGeo, globeMat)
    scene.add(globe)

    // Appliquer la rotation initiale
    globe.rotation.x = rotation.x
    globe.rotation.y = rotation.y

    createAtmosphere()
    createStars()
    loadGeoJSON()
    setupEvents()
    calculateLayout(true) // Calcul initial instantané
    animate()
  }

  function calculateLayout(instant = false) {
    if (!camera || !canvas || !renderer) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h, false) 

    const aspect = w / h
    // Sur desktop (aspect > 1), on réduit la taille du globe (coverage passe de 0.85 à 0.65)
    const targetCoverage = aspect < 0.6 ? 0.75 : (aspect > 1 ? 0.65 : 0.85) 
    const tanHalfFov = Math.tan((45 / 2) * (Math.PI / 180))

    let requiredH = 2 / targetCoverage
    if (aspect < 1) requiredH /= aspect
    const targetZ = requiredH / (2 * tanHalfFov)
    
    const headH = aspect < 1 ? 50 : 100
    const legH = aspect < 1 ? 100 : 160
    const pixelOffset = (legH - headH) / 2
    const targetY = (pixelOffset / h) * requiredH

    gsap.killTweensOf(camera.position)

    if (instant) {
      camera.position.z = targetZ
      camera.position.y = targetY
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    } else {
      gsap.to(camera.position, {
        z: targetZ,
        y: targetY,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          camera.aspect = canvas.clientWidth / canvas.clientHeight
          camera.updateProjectionMatrix()
        }
      })
    }
  }

  function createAtmosphere() {
    const atmGeo = new THREE.SphereGeometry(1.065, 64, 64)
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.4 },
        p: { value: 5.0 },
        glowColor: { value: new THREE.Color(themeColors['text_accent'] || '#2e8a42') },
        viewVector: { value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.7 - dot(vNormal, vNormel), 4.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.6);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
    atmosphere = new THREE.Mesh(atmGeo, atmMat)
    scene.add(atmosphere)
  }

  function createStars() {
    const starGeo = new THREE.BufferGeometry()
    const count = 6000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 80 + Math.random() * 120
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.8 })
    starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)
  }

  async function loadGeoJSON() {
    const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
    const US_STATES_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
    try {
      const [topoRes, usRes, namesRes] = await Promise.all([
        fetch(GEOJSON_URL), fetch(US_STATES_URL),
        fetch('https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/slim-2/slim-2.json')
      ])
      const topo = await topoRes.json(); const usTopo = await usRes.json(); const isoNames = await namesRes.json()
      const topojson = await import('topojson-client')
      const geojson: any = topojson.feature(topo, topo.objects.countries as any)
      const usGeojson: any = topojson.feature(usTopo, (usTopo.objects as any).states)

      const numToISO: Record<string, string> = {}
      isoNames.forEach((row: any) => { numToISO[row['country-code']] = row['alpha-2'] })
      geojson.features.forEach((f: any) => {
        const num = f.id || f.properties?.id
        f.properties = f.properties || {}
        f.properties.iso_a2 = numToISO[String(num).padStart(3, '0')] || ''
      })
      usGeojson.features.forEach((f: any) => {
        const name = f.properties?.name || ''
        f.properties = f.properties || {}; f.properties.iso_a2 = nameMap[name] || ''
        if (f.properties.iso_a2) geojson.features.push(f)
      })
      geoData = geojson; drawCountries()
    } catch (err) { console.error('Error loading GeoJSON:', err); drawCountries() }
  }

  function drawCountries() {
    if (!geoData) return
    const defaultBg = themeColors['ocean'] || themeColors['nodata'] || '#0D1A17'
    colorCtx.fillStyle = defaultBg; colorCtx.fillRect(0, 0, MAP_W, MAP_H)
    pickCtx.fillStyle = '#000000'; pickCtx.fillRect(0, 0, MAP_W, MAP_H)
    let pickIndex = 1; countryMap = {}
    geoData.features.forEach((feature: any) => {
      const props = feature.properties || {}
      const code = (props.iso_a2 || '').toUpperCase()
      if (code === 'US') return
      const status = statusByCode[code] || 'nodata'
      const fillColor = colorsByStatus[status] || defaultBg
      const pickColor = `rgb(${(pickIndex >> 16) & 0xFF}, ${(pickIndex >> 8) & 0xFF}, ${pickIndex & 0xFF})`
      countryMap[pickIndex] = code; pickIndex++
      const geom = feature.geometry; if (!geom) return
      const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
      rings.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          if (code === 'AQ') {
            colorCtx.beginPath(); pickCtx.beginPath(); let lastLon: number | null = null; let lastPx: number | null = null
            ring.forEach(([lon, lat]: [number, number], i: number) => {
              const [u, v] = geoToUV(lon, lat); const [px, py] = uvToPixel(u, v, MAP_W, MAP_H)
              const jump = lastLon !== null && Math.abs(lon - lastLon) > 180
              if (i === 0) { colorCtx.moveTo(px, py); pickCtx.moveTo(px, py) }
              else if (jump) {
                if (lat < -60) {
                  colorCtx.lineTo(lastPx!, MAP_H); pickCtx.lineTo(lastPx!, MAP_H)
                  colorCtx.lineTo(px, MAP_H); pickCtx.lineTo(px, MAP_H)
                  colorCtx.lineTo(px, py); pickCtx.lineTo(px, py)
                } else { colorCtx.moveTo(px, py); pickCtx.moveTo(px, py) }
              } else { colorCtx.lineTo(px, py); pickCtx.lineTo(px, py) }
              lastLon = lon; lastPx = px
            })
            colorCtx.closePath(); colorCtx.fillStyle = fillColor; colorCtx.fill()
            colorCtx.strokeStyle = themeColors['country_border'] || '#14322399'; colorCtx.lineWidth = 1.2; colorCtx.stroke()
            pickCtx.closePath(); pickCtx.fillStyle = pickColor; pickCtx.fill()
          } else {
            colorCtx.beginPath(); pickCtx.beginPath(); let lastLon: number | null = null; let accumOffset = 0
            ring.forEach(([lon, lat]: [number, number], i: number) => {
              if (lastLon !== null) { if (lon - lastLon > 180) accumOffset -= MAP_W; else if (lastLon - lon > 180) accumOffset += MAP_W }
              const [u, v] = geoToUV(lon, lat); const [basePx, py] = uvToPixel(u, v, MAP_W, MAP_H)
              const px = basePx + accumOffset
              if (i === 0) { colorCtx.moveTo(px, py); pickCtx.moveTo(px, py) }
              else { colorCtx.lineTo(px, py); pickCtx.lineTo(px, py) }
              lastLon = lon
            })
            colorCtx.closePath(); colorCtx.fillStyle = fillColor; colorCtx.fill()
            colorCtx.strokeStyle = themeColors['country_border'] || '#14322399'; colorCtx.lineWidth = 1.2; colorCtx.stroke()
            pickCtx.closePath(); pickCtx.fillStyle = pickColor; pickCtx.fill()
          }
        })
      })

      if (code === 'AQ') {
        colorCtx.fillStyle = fillColor; colorCtx.fillRect(0, MAP_H - 3, MAP_W, 3)
        pickCtx.fillStyle = pickColor; pickCtx.fillRect(0, MAP_H - 3, MAP_W, 3)
      }
    })
    colorTexture.needsUpdate = true
    pickBuffer = pickCtx.getImageData(0, 0, MAP_W, MAP_H)
  }

  function updateData(newS: Record<string, string>, newC: Record<string, string>, newT: Record<string, string> = {}) {
    statusByCode = newS; colorsByStatus = newC; themeColors = newT; drawCountries()
  }

  function getCountryAtMouse(mx: number, my: number): string | null {
    if (!pickBuffer || !camera || !renderer) return null
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((mx - rect.left) / rect.width) * 2 - 1
    mouse.y = -((my - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObject(globe)
    if (!hits.length) return null
    const uv = hits[0].uv; if (!uv) return null
    const px = Math.floor(uv.x * MAP_W); const py = Math.floor((1 - uv.y) * MAP_H)
    const idx = (py * MAP_W + px) * 4
    const r = pickBuffer.data[idx]; const g = pickBuffer.data[idx+1]; const b = pickBuffer.data[idx+2]
    const key = (r << 16) | (g << 8) | b
    return countryMap[key] || null
  }

  function setupEvents() {
    canvas.addEventListener('mousedown', e => {
      isDragging = false
      prevMouse = { x: e.clientX, y: e.clientY }
      canvas.addEventListener('mousemove', onDrag)
    })

    canvas.addEventListener('mouseup', e => {
      canvas.removeEventListener('mousemove', onDrag)
      if (!isDragging) {
        const code = getCountryAtMouse(e.clientX, e.clientY)
        if (onCountryClick) onCountryClick(code)
      }
      isDragging = false
    })

    canvas.addEventListener('mousemove', e => {
      if (!isDragging) {
        const code = getCountryAtMouse(e.clientX, e.clientY)
        if (code !== hoveredCountry) {
          hoveredCountry = code
          canvas.style.cursor = code ? 'pointer' : 'grab'
          if (onCountryHover) onCountryHover(code)
        }
      }
    })

    canvas.addEventListener('wheel', e => {
      e.preventDefault()
      const factor = e.deltaY * 0.001
      camera.position.z = Math.max(1.4, Math.min(6, camera.position.z + factor))
    }, { passive: false })

    let lastTouch: Touch | null = null
    let touchStartPos = { x: 0, y: 0 }
    let lastPinchDist = 0

    canvas.addEventListener('touchstart', e => {
      e.preventDefault() // Bloquer le zoom/défilement natif
      lastTouch = e.touches[0]
      touchStartPos = { x: lastTouch.clientX, y: lastTouch.clientY }
      isDragging = false
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    })

    canvas.addEventListener('touchmove', e => {
      e.preventDefault() // Bloquer le zoom/défilement natif
      if (e.touches.length === 1 && lastTouch) {
        const t = e.touches[0]
        const dx = t.clientX - lastTouch.clientX
        const dy = t.clientY - lastTouch.clientY
        const dist = Math.hypot(t.clientX - touchStartPos.x, t.clientY - touchStartPos.y)
        if (dist > 10) isDragging = true
        if (isDragging) {
          velocity.y = dx * 0.005
          velocity.x = dy * 0.005
          rotation.y += velocity.y
          rotation.x += velocity.x
          updateGlobeRotation()
        }
        lastTouch = t
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        if (lastPinchDist > 0) {
          const delta = (lastPinchDist - dist) * 0.02
          camera.position.z = Math.max(1.4, Math.min(6, camera.position.z + delta))
        }
        lastPinchDist = dist
        isDragging = true 
      }
    }, { passive: false })

    canvas.addEventListener('touchend', () => {
      if (!isDragging && lastTouch) {
        const code = getCountryAtMouse(lastTouch.clientX, lastTouch.clientY)
        if (onCountryClick) onCountryClick(code)
      }
      lastTouch = null
      lastPinchDist = 0
      isDragging = false
    })

    window.addEventListener('resize', onResize)
  }

  function updateGlobeRotation() {
    rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x))
    globe.rotation.x = rotation.x
    globe.rotation.y = rotation.y
  }

  function onDrag(e: MouseEvent) {
    const dx = e.clientX - prevMouse.x
    const dy = e.clientY - prevMouse.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging = true
    velocity.y = dx * 0.005
    velocity.x = dy * 0.005
    rotation.y += velocity.y
    rotation.x += velocity.x
    updateGlobeRotation()
    prevMouse = { x: e.clientX, y: e.clientY }
  }

  function onResize() {
    calculateLayout(false)
  }

  function animate() {
    animFrame = requestAnimationFrame(animate)

    if (!isDragging) {
      if (!isPaused) {
        velocity.x *= 0.92
        velocity.y *= 0.92
        rotation.y += velocity.y
        rotation.x += velocity.x
        
        // Vitesse de rotation avec effet "decrescendo" progressif
        // On ralentit de façon quadratique entre Z=3.0 et Z=1.4
        // Cela permet un freinage fluide et naturel plutôt qu'un arrêt brusque.
        const baseSpeed = 0.0008
        const currentZ = camera.position.z
        
        const t = Math.max(0, Math.min(1, (currentZ - 1.4) / (3.0 - 1.4)))
        const speedFactor = t * t // Courbe pour le decrescendo
        
        rotation.y += baseSpeed * speedFactor
      }

      updateGlobeRotation()
    }

    if (atmosphere && ((atmosphere.material as THREE.ShaderMaterial).uniforms)) {
      (atmosphere.material as THREE.ShaderMaterial).uniforms.viewVector.value = camera.position.clone()
    }

    renderer.render(scene, camera)
  }

  function destroy() {
    cancelAnimationFrame(animFrame)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
  }

  function setOnCountryClick(fn: (code: string | null) => void) { onCountryClick = fn }
  function setOnCountryHover(fn: (code: string | null) => void) { onCountryHover = fn }

  function focusCountry(code: string) {
    if (!geoData) return
    const feature = geoData.features.find((f: any) =>
      f.properties.iso_a2 === code || f.properties.ISO_A2 === code
    )
    if (!feature) return
    const coords = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0]
    let sumLon = 0
    coords.forEach(([lon]: [number, number]) => { sumLon += lon })
    const lon = sumLon / coords.length

    let currentY = rotation.y % (Math.PI * 2)
    if (currentY > Math.PI) currentY -= Math.PI * 2
    if (currentY < -Math.PI) currentY += Math.PI * 2
    rotation.y = currentY 

    if (focusTween) focusTween.kill()
    velocity.x = 0
    velocity.y = 0
    isPaused = true

    const targetY = ((-lon) * Math.PI) / 180 - (Math.PI / 2)

    let deltaY = (targetY - currentY) % (Math.PI * 2)
    if (deltaY > Math.PI) deltaY -= Math.PI * 2
    if (deltaY < -Math.PI) deltaY += Math.PI * 2
    const finalTargetY = currentY + deltaY

    focusTween = gsap.to(rotation, {
      y: finalTargetY,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        globe.rotation.y = rotation.y
      }
    })
  }

  function setIsPaused(val: boolean) {
    isPaused = val
  }

  return { init, destroy, setOnCountryClick, setOnCountryHover, focusCountry, updateData, setIsPaused }
}
