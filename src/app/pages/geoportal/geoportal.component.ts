import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SideBarComponent} from "./side-bar/side-bar.component";
import {getUid, Map} from 'ol';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {OSM, TileWMS} from 'ol/source';
import ImageLayer from "ol/layer/Image";
import {ImageWMS} from "ol/source";
import {fromLonLat, transform} from "ol/proj";
import {CompartidoService} from "../../Services/compartido.service";
import {Interaction, Modify, Select, Snap} from 'ol/interaction';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import {LocalStorageProvider} from '../../Services/LocalStorageService/LocalStorageProvider';
import {click} from "ol/events/condition";
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import GeoJSON from 'ol/format/GeoJSON';


@Component({
    selector: '.app-geoportal',
    templateUrl: './geoportal.component.html',
    styleUrls: ['./geoportal.component.css']
})

export class GeoportalComponent implements OnInit {

    @ViewChild(SideBarComponent, {static: true}) sidebar!: SideBarComponent;
    @ViewChild('map', {static: true}) mapElement!: ElementRef;


    map!: Map;
    pnoaLayer!: ImageLayer<ImageWMS>;
    WMSLayer!: any;
    vectorSource!: VectorSource;
    vectorLayer!: VectorLayer<any>;
    draw!: Interaction;
    drawPunto!: Interaction;
    drawDistancia!: Interaction;
    modify!: Modify;
    snap!: Snap;
    geometries!: any[];
    selectedPolygonCoordinates: string = '';
    select: Select | null = null;
    wmsLayers: TileLayer<TileWMS>[] = [];
    wmsLayerNames: string[] = [];


    constructor(
        private compartidoService: CompartidoService,
        private localStorageProvider: LocalStorageProvider
    ) {
    }


    ngOnInit(): void {
        this.iniciarMapa();
        this.iniciarCapas();
        this.iniciarInteracciones();
        this.cargarGeometrias();
        this.suscripciones();

    }

    private iniciarMapa() {
        this.map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                this.pnoaLayer = new ImageLayer({
                    source: new ImageWMS({
                        url: 'https://www.ign.es/wms-inspire/pnoa-ma',
                        params: {
                            'LAYERS': 'OI.OrthoimageCoverage'
                        },
                        ratio: 1,
                        serverType: 'geoserver'
                    }),
                    visible: this.compartidoService.showPNOA // la capa PNOA estará desactivada por defecto
                }),
                this.WMSLayer = new TileLayer<TileWMS>({
                    source: new TileWMS({
                        url: 'https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx',
                        params: {
                            LAYERS: 'CP.CadastralParcel,CP.CadastralZoning,AD.Address,BU.Building,BU.BuildingPart,AU.AdministrativeUnit,AU.AdministrativeBoundary',
                            FORMAT: 'image/png',
                            TRANSPARENT: 'true'
                        },
                        serverType: 'geoserver'
                    }),
                    visible: this.compartidoService.showWMS // la capa catastro estará desactivada por defecto
                }),

            ],
            // AQUÍ SE AJUSTA EL ZOOM Y LA VISTA PARA QUE SE CENTRE EN ESPAÑA
            view: new View({
                center: fromLonLat([-4, 40]),
                zoom: 6
            })
        });
    }

    private iniciarCapas() {
        this.vectorSource = new VectorSource();
        this.vectorLayer = new VectorLayer({
            source: this.vectorSource,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        this.map.getLayers().push(this.vectorLayer);
    }

    private iniciarInteracciones() {
        this.draw = new Draw({
            source: this.vectorSource,
            type: 'Polygon'
        });

        this.drawPunto = new Draw({
            source: this.vectorSource,
            type: 'Point'
        });

        this.drawDistancia = new Draw({
            source: this.vectorSource,
            type: 'LineString'
        });

        this.modify = new Modify({
            source: this.vectorSource
        });
        this.map.addInteraction(this.modify);

        this.snap = new Snap({
            source: this.vectorSource
        });
        this.map.addInteraction(this.snap);

        this.draw.addEventListener('drawend', (event: any) => {
            this.handleDrawEnd(event.feature, 'Polygon');
        });

        this.drawPunto.addEventListener('drawend', (event: any) => {
            this.handleDrawEnd(event.feature, 'Point');
        });

        this.drawDistancia.addEventListener('drawend', (event: any) => {
            this.handleDrawEnd(event.feature, 'LineString');
        });
    }

    private handleDrawEnd(feature: Feature, geometryType: string) {
        console.log("data antes de dibujar nada", this.localStorageProvider.getData());
        const featureId = getUid(feature);

        const features = this.vectorSource.getFeatures();
        const isFeaturePresent = features.some((existingFeature) => {
            return existingFeature.getId() === featureId;
        });

        if (!isFeaturePresent) {
            feature.setId(featureId);
            this.vectorSource.addFeature(feature);

            let geometryCoordinates;
            if (geometryType === 'Point') {
                const geometry = feature.getGeometry() as Point;
                geometryCoordinates = geometry.getCoordinates();
            } else if (geometryType === 'LineString') {
                const geometry = feature.getGeometry() as LineString;
                geometryCoordinates = geometry.getCoordinates();
            } else if (geometryType === 'Polygon') {
                const geometry = feature.getGeometry() as Polygon;
                geometryCoordinates = geometry.getCoordinates();
            }

            const geometryData = {
                id: featureId,
                type: geometryType,
                geometry: geometryCoordinates
            };

            this.geometries.push(geometryData);
            this.localStorageProvider.setData(this.geometries);
            console.log("data despúes de dibujar algo nuevo: ", this.localStorageProvider.getData());
            console.log('Geometría guardada en el Web Storage');
        } else {
            console.log('La característica ya está presente en la fuente de vectores');
        }
    }

    private cargarGeometrias() {
        const STORAGE_KEY: string = "GeometryData";
        try {
            this.geometries = this.localStorageProvider.getData();
            this.geometries.forEach((geometryItem: any) => {
                const id = geometryItem.id;
                const coordinates = geometryItem.geometry;
                const type = geometryItem.type;

                let geometry;
                if (type === 'Point') {
                    geometry = new Point(coordinates);
                } else if (type === 'Distance') {
                    // Para que solo coja la primera y última coordenada y no coordenadas de por en medio
                    geometry = new LineString([coordinates[0], coordinates[coordinates.length - 1]]);
                } else {
                    geometry = new Polygon(coordinates);
                }

                const feature = new Feature(geometry);
                feature.setId(id);

                this.vectorSource.addFeature(feature);
            });

            if (this.geometries.length > 0) {
                const firstGeometry = this.geometries[0];
                this.selectedPolygonCoordinates = JSON.stringify(firstGeometry.geometry);
            }
        } catch (error) {
            console.log('Error al analizar los datos de geometría del Web Storage:', error);
        }
    }


    private seleccionarGeometrias() {

        const selected = new Style({
            fill: new Fill({
                color: '#eeeeee',
            }),
            stroke: new Stroke({
                color: 'rgba(255, 255, 255, 0.7)',
                width: 2,
            }),
        });

        function selectStyle(feature: any) {
            const color = feature.get('COLOR') || '#eeeeee';
            selected.getFill().setColor(color);
            return selected;
        }


        const selectClick = new Select({
            condition: click,
            style: selectStyle,
            filter: function (geometries) {
                return geometries.getId() !== undefined;
            }
        });

        const changeInteraction = () => {
            console.log('Limpiando interacciones anteriores y añadiendo interacción de selección.');
            if (this.select !== null) {
                this.map.removeInteraction(this.select);
            }
            this.map.addInteraction(selectClick);
        };

        selectClick.on('select', (e) => {
            const selectedFeatures = e.target.getFeatures();
            if (selectedFeatures.getLength() > 0) {
                const selectedFeature = selectedFeatures.item(0);
                const geometryType = selectedFeature.getGeometry().getType();
                const geometry = selectedFeature.getGeometry();

                let coordinatesWKT = '';

                if (geometryType === 'Polygon') {
                    const polygonGeometry = geometry as Polygon;
                    const coordinates = polygonGeometry.getCoordinates()[0];
                    console.log("Las coordenadas del polígono son: ", coordinates);
                    if (coordinates.length >= 3) {
                        const primeras3Coordenadas = coordinates.slice(0, 3);
                        console.log("Las 3 primeras coordenadas son: ", primeras3Coordenadas);

                        const coordendasFormateadas = primeras3Coordenadas
                            .map(coord => formatCoord(coord))
                            .join('; ');

                        coordinatesWKT = `POLYGON((${coordendasFormateadas}))`;
                    }

                } else if (geometryType === 'LineString') {
                    const lineGeometry = geometry as LineString;
                    const startCoord = lineGeometry.getFirstCoordinate();
                    const endCoord = lineGeometry.getLastCoordinate();
                    coordinatesWKT = `LINESTRING(${formatCoord(startCoord)}, ${formatCoord(endCoord)})`;

                } else if (geometryType === 'Point') {
                    const pointGeometry = geometry as Point;
                    coordinatesWKT = `POINT(${formatCoord(pointGeometry.getCoordinates())})`;
                }

                const coordinatesTextArea = document.getElementById(
                    'coordinatesTextArea'
                ) as HTMLTextAreaElement;
                coordinatesTextArea.value = coordinatesWKT || '';
            } else {
                const coordinatesTextArea = document.getElementById(
                    'coordinatesTextArea'
                ) as HTMLTextAreaElement;
                coordinatesTextArea.value = '';
            }
        });

        function formatCoord(coord: number[]): string {
            return coord.map((c) => c.toFixed(4)).join(' ');
        }

        changeInteraction();
    }

    loadAndDisplayGeoJSON(geoJSONData: any): void {

        const geoJSONFormat = new GeoJSON();
        const features = geoJSONFormat.readFeatures(geoJSONData);

        this.vectorSource.clear();
        this.vectorSource.addFeatures(features);

        if (features.length > 0) {
            this.map.getView().fit(this.vectorSource.getExtent());
        }
    }

    private agregarNuevaCapaWMS(url: string, nombreCapa: string) {
        const wmsSourceOptions = {
            url: url,
            params: {
                'LAYERS': nombreCapa,
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true',
            },
        };

        const wmsSource = new TileWMS(wmsSourceOptions);
        const wmsLayer = new TileLayer({
            source: wmsSource,
            visible: true,
        });

        const layerName = `${nombreCapa}_${Date.now()}`;

        wmsLayer.set('name', layerName);

        this.map.addLayer(wmsLayer);

        this.wmsLayers.push(wmsLayer);
        this.wmsLayerNames.push(nombreCapa);
        console.log(this.wmsLayers);

    }

    private quitarCapaWMS(nombreCapa: string) {
        const index = this.wmsLayerNames.indexOf(nombreCapa); // Buscar el índice del nombre

        if (index !== -1) {
            const layerToRemove = this.wmsLayers[index];
            this.map.removeLayer(layerToRemove);
            this.wmsLayers.splice(index, 1); // Eliminar la capa de this.wmsLayers
            this.wmsLayerNames.splice(index, 1); // Eliminar el nombre de wmsLayerNames
        }
        console.log("Al quitar la capa: ", nombreCapa)
    }

    private suscripciones() {
        this.compartidoService.showPNOA$.subscribe((showPNOA) => {
            this.pnoaLayer.setVisible(showPNOA);
        });

        this.compartidoService.showWMS$.subscribe((showWMS) => {
            this.WMSLayer.setVisible(showWMS);
        });

        this.compartidoService.drawing$.subscribe((value) => {
            console.log("drawing$", value);
            if (value) {
                this.map.addInteraction(this.draw);
            } else {
                this.map.removeInteraction(this.draw);
            }
        });
        this.compartidoService.drawingPunto$.subscribe((value) => {
            console.log("drawingPunto$", value);
            if (value) {
                this.map.addInteraction(this.drawPunto);
            } else {
                this.map.removeInteraction(this.drawPunto);
            }
        });
        this.compartidoService.drawingDistancia$.subscribe((value) => {
            console.log("drawingDistancia$", value);
            if (value) {
                this.map.addInteraction(this.drawDistancia);
            } else {
                this.map.removeInteraction(this.drawDistancia);
            }
        });

        this.compartidoService.selecting$.subscribe((value) => {
            console.log("selecting$", value);
            if (value) {
                this.seleccionarGeometrias()
            } else {
                if (this.select !== null) {
                    this.map.removeInteraction(this.select);
                }
            }
        });

        this.compartidoService.eliminarGeometrias$.subscribe(() => {
            console.log("Datos antes de borrarlos: ", this.localStorageProvider.getData())
            this.localStorageProvider.clearData();
            this.vectorSource.clear();
            this.geometries = [];
            console.log("Datos después de borrarlos: ", this.localStorageProvider.getData())
        });

        this.compartidoService.geoJSONData$.subscribe((geoJSONData) => {
            this.loadAndDisplayGeoJSON(geoJSONData);
        });

        this.compartidoService.agregarNuevaCapaWMS$.subscribe(({url, nombreCapa}) => {
            this.agregarNuevaCapaWMS(url, nombreCapa);
        });

        this.compartidoService.quitarCapaWMS$.subscribe(({url, nombreCapa}) => {
            //this.quitarCapaWMS(url, nombreCapa);
            this.quitarCapaWMS(nombreCapa);
        });


    };

}
