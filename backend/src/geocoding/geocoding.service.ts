import { Injectable, Logger } from '@nestjs/common';
import * as NodeGeocoder from 'node-geocoder';

@Injectable()
export class GeocodingService {

  private readonly logger = new Logger(GeocodingService.name);

  private geocoder: any;


  constructor() {

    this.geocoder = NodeGeocoder.default({
      provider: 'openstreetmap',
      httpAdapter: 'https',
      timeout: 5000,
    });


    this.logger.log(
      'Geocoding service initialized with OpenStreetMap'
    );
  }



  /**
   * Convert address/location text into coordinates
   */
  async geocodeLocation(location: string): Promise<{
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string | null;
  }> {

    if (!location || location.trim() === '') {
      return {
        latitude: null,
        longitude: null,
        formattedAddress: null,
      };
    }


    try {

      this.logger.log(
        `Geocoding location: "${location}"`
      );


      const results =
        await this.geocoder.geocode(location);


      if (results && results.length > 0) {

        const result = results[0];


        this.logger.log(
          `Geocoding successful: ${result.latitude}, ${result.longitude}`
        );


        return {
          latitude: result.latitude ?? null,
          longitude: result.longitude ?? null,

          formattedAddress:
            result.formattedAddress ??
            result.display_name ??
            location,
        };
      }


      this.logger.warn(
        `No geocoding results for: "${location}"`
      );


      return {
        latitude: null,
        longitude: null,
        formattedAddress: location,
      };


    } catch (error) {

      this.logger.error(
        `Geocoding failed for "${location}": ${error.message}`
      );


      return {
        latitude: null,
        longitude: null,
        formattedAddress: location,
      };

    }

  }





  /**
   * Convert coordinates into address
   */
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{
    address: string | null;
    formattedAddress: string | null;
  }> {


    if (!lat || !lng) {

      return {
        address: null,
        formattedAddress: null,
      };

    }



    try {

      this.logger.log(
        `Reverse geocoding: ${lat}, ${lng}`
      );


      const results =
        await this.geocoder.reverse({
          lat,
          lon: lng,
        });



      if (results && results.length > 0) {

        const result = results[0];


        return {

          address:
            result.streetName ??
            result.city ??
            result.formattedAddress ??
            null,


          formattedAddress:
            result.formattedAddress ??
            result.display_name ??
            null,
        };

      }



      return {
        address: null,
        formattedAddress: null,
      };



    } catch (error) {

      this.logger.error(
        `Reverse geocoding failed: ${error.message}`
      );


      return {
        address: null,
        formattedAddress: null,
      };

    }

  }

}