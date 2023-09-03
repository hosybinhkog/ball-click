import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as CANNON from 'cannon-es'

const timeStep = 1 / 60
const meshes: THREE.Mesh[] = []
const bodies: CANNON.Body[] = []
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 2, 14)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const ambientLight = new THREE.AmbientLight('white', 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('white', 0.8)
directionalLight.position.set(0, 50, 0)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

const axesHelper = new THREE.AxesHelper(4)
scene.add(axesHelper)

const gridHelper = new THREE.GridHelper(40, 40, 'skyblue', 'skyblue')
scene.add(gridHelper)

const planeGep = new THREE.PlaneGeometry(10, 10)
const planeMat = new THREE.MeshStandardMaterial({
    color: 'white',
    side: THREE.DoubleSide,
})

const planeMesh = new THREE.Mesh(planeGep, planeMat)
scene.add(planeMesh)
planeMesh.receiveShadow = true

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.18, 0),
})
const planeMatBody = new CANNON.Material()
const planeBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.001)),
    material: planeMatBody,
})

planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
world.addBody(planeBody)

const mouse = new THREE.Vector2()
const intersectionPlane = new THREE.Vector3()
const planeNormal = new THREE.Vector3()
const plane = new THREE.Plane()
const raycaster = new THREE.Raycaster()

window.addEventListener('mousedown', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    planeNormal.copy(camera.position).normalize()
    plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position)
    raycaster.setFromCamera(mouse, camera)
    raycaster.ray.intersectPlane(plane, intersectionPlane)
})

function createPoint(position: THREE.Vector3, scene: THREE.Scene, world: CANNON.World) {
    const sphereGeo = new THREE.SphereGeometry(0.125, 30, 30)
    const sphereMat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0,
        roughness: 0,
    })

    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
    sphereMesh.castShadow = true
    scene.add(sphereMesh)
    const sphereMatBody = new CANNON.Material()
    const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.125),
        position: new CANNON.Vec3(position.x, position.y, position.z),
        material: sphereMatBody,
    })

    world.addBody(sphereBody)

    const planeSphereContactMaterial = new CANNON.ContactMaterial(planeMatBody, sphereMatBody, {
        restitution: 0.3,
    })
    world.addContactMaterial(planeSphereContactMaterial)
    meshes.push(sphereMesh)
    bodies.push(sphereBody)
}

window.addEventListener('click', function (e) {
    createPoint(intersectionPlane, scene, world)
})

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    world.step(timeStep)
    // @ts-ignore
    planeMesh.position.copy(planeBody.position)
    // @ts-ignore
    planeMesh.quaternion.copy(planeBody.quaternion)

    for (let i = 0; i < meshes.length; i++) {
        // @ts-ignore
        meshes[i].position.copy(bodies[i].position)
        // @ts-ignore
        meshes[i].quaternion.copy(bodies[i].quaternion)
    }
    render()
}

function render() {
    renderer.render(scene, camera)
}
animate()
