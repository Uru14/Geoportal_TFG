import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SideBarComponent} from "./side-bar/side-bar.component";
import {getUid, Map} from 'ol';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {OSM, TileWMS} from 'ol/source';
import ImageLayer from "ol/layer/Image";
import {ImageWMS} from "ol/source";
import {fromLonLat} from "ol/proj";
import {CompartidoService} from "../../Services/compartido.service";
import {Interaction, Modify, Select, Snap} from 'ol/interaction';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { LocalStorageProvider } from '../../Services/LocalStorageService/LocalStorageProvider';
import {click} from "ol/events/condition";
import WKT from 'ol/format/WKT';



@Component({
  selector: '.app-geoportal',
  templateUrl: './geoportal.component.html',
  styleUrls: ['./geoportal.component.css']
})

export class GeoportalComponent implements OnInit {

  @ViewChild(SideBarComponent, {static: true}) sidebar!: SideBarComponent;
  @ViewChild('map', { static: true }) mapElement!: ElementRef;


  map!: Map;
  pnoaLayer!: ImageLayer<ImageWMS>;
  WMSLayer!: any;
  vectorSource!: VectorSource;
  vectorLayer!: VectorLayer<any>;
  draw!: Interaction;
  modify!: Modify;
  snap!: Snap;
  geometries!: any[];
  selectedPolygonCoordinates: string = '';
  currentPolygonCoordinates: string = '';
  select: Select | null = null;




  constructor(
    private compartidoService: CompartidoService,
    private localStorageProvider: LocalStorageProvider
  ) {}


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
        this.WMSLayer = new TileLayer({
          source: new TileWMS({
            url: 'https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx',
            params: {
              LAYERS: 'CP.CadastralParcel',
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


    this.modify = new Modify({
      source: this.vectorSource
    });
    this.map.addInteraction(this.modify);



    this.snap = new Snap({
      source: this.vectorSource
    });
    this.map.addInteraction(this.snap);

    //He tenido que usar addEventListener en vez de on porque 'on' no cogía 'drawend'
    this.draw.addEventListener('drawend', (event: any) => {
      console.log("event drawend triggered")
      const feature = event.feature;
      // Generar un ID único para la característica
      const featureId = getUid(feature);

      // Obtener todas las características existentes en la fuente vectorial
      const features = this.vectorSource.getFeatures();

      // Verificar si alguna característica tiene el mismo ID
      const isFeaturePresent = features.some((existingFeature) => {
        return existingFeature.getId() === featureId;
      });

      if (!isFeaturePresent) {
        // Establecer el ID único en la característica
        feature.setId(featureId);

        // Agregar la característica solo si no está presente
        this.vectorSource.addFeature(feature);

        const geometryData = {
          id: featureId,
          geometry: feature.getGeometry().getCoordinates()
        };
        console.log("Geometries old", this.geometries);
        this.geometries.push(geometryData);
        console.log("Geometries new", this.geometries);


        this.localStorageProvider.setData(this.geometries);

        console.log('Geometría guardada en el Web Storage');
        // Actualizar las coordenadas del último polígono dibujado
        this.currentPolygonCoordinates = JSON.stringify(geometryData.geometry);
      } else {
        console.log('La característica ya está presente en la fuente de vectores');
      }
    });
  }

  private cargarGeometrias() {
    const STORAGE_KEY: string = "GeometryData";
    try {
      this.geometries = this.localStorageProvider.getData();
      //console.log(this.geometries, typeof this.geometries);
      this.geometries.forEach((geometryItem: any) => {
        const id = geometryItem.id;
        const coordinates = geometryItem.geometry;


        const geometry = new Polygon(coordinates);


        const feature = new Feature(geometry);
        feature.setId(id);


        this.vectorSource.addFeature(feature);

        console.log('Figura dibujada en el mapa');
      });

      if (this.geometries.length > 0) {
        const firstGeometry = this.geometries[0];
        this.selectedPolygonCoordinates = JSON.stringify(firstGeometry.geometry);
      }
    } catch (error) {
      console.log('Error al analizar los datos de geometría del Web Storage:', error);
    }
  }

  private seleccionarGeometrias(){

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

    const changeInteraction = (polygonId: string) => {
      console.log('ID del polígono seleccionado:', polygonId);

      if (this.select !== null) {
        this.map.removeInteraction(this.select);
      }

      this.select = selectClick;

      if (this.select !== null) {
        this.map.addInteraction(this.select);
        this.select.on('select', function (e) {
          // polygonId = e.target.getFeatures().getArray()[0]?.getId();
          // console.log('ID del polígono seleccionado:', polygonId);
          const selectedFeatures = e.target.getFeatures();
          if (selectedFeatures.getLength() > 0) {
            const selectedFeature = selectedFeatures.item(0);
            const format = new WKT();
            const wkt = format.writeGeometry(selectedFeature.getGeometry());
            const coordinatesTextArea = document.getElementById('coordinatesTextArea') as HTMLTextAreaElement;
            coordinatesTextArea.value = wkt;
          } else {
            const coordinatesTextArea = document.getElementById('coordinatesTextArea') as HTMLTextAreaElement;
            coordinatesTextArea.value = '';
          }
        });
      }
    };

    selectClick.on('select', (e) => {
      const selectedFeatures = e.target.getFeatures();
      if (selectedFeatures.getLength() > 0) {
        const selectedFeature = selectedFeatures.item(0);
        const polygonId = selectedFeature.getId();
        changeInteraction(polygonId);
      }
    });

    changeInteraction('');
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

    this.compartidoService.selecting$.subscribe((value) => {
      console.log("selecting$", value);
      if (value) {
        this.seleccionarGeometrias()
      } else {
        // this.map.removeInteraction();
      }
    });

    this.compartidoService.eliminarGeometrias$.subscribe(() => {
      this.localStorageProvider.clearData();
      this.vectorSource.clear();

    });
  }

}
