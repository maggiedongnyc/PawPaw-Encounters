# Location Feature Setup Guide

## Overview

The upload page now includes location functionality with two options:
1. **Use my current location** - Uses browser Geolocation API
2. **Select location on map** - Interactive map using Leaflet

## Installation

After pulling the changes, install the new dependencies:

```bash
npm install
```

This will install:
- `leaflet` - Map library
- `react-leaflet` - React bindings for Leaflet
- `@types/leaflet` - TypeScript types

## Database Schema

The location is stored as a JSON string in the `location` column with the format:
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "name": "Lat: 37.774900, Lng: -122.419400"
}
```

The existing `location` column (TEXT type) will work fine. If you want to use JSONB for better querying, you can run:

```sql
ALTER TABLE "Encounters" ALTER COLUMN location TYPE JSONB USING location::JSONB;
```

But this is optional - the current TEXT column works perfectly.

## Features

### Upload Page
- ✅ "Use my current location" button - Gets GPS coordinates via browser
- ✅ "Select location on map" button - Shows interactive map
- ✅ Map is responsive with 300px height
- ✅ Click on map to select location
- ✅ Location display shows coordinates
- ✅ Form validation - cannot submit without location
- ✅ Location stored as JSON string

### Gallery Page
- ✅ Displays location if present
- ✅ Handles both new JSON format and legacy string format
- ✅ Shows location name or coordinates

## Usage

1. **Using Current Location:**
   - Click "Use my current location" button
   - Browser will ask for location permission
   - Once granted, coordinates are automatically filled

2. **Using Map:**
   - Click "Select location on map" button
   - Map appears (300px height)
   - Click anywhere on the map to select location
   - Coordinates update automatically

3. **Submitting:**
   - Location is required (form won't submit without it)
   - Location is stored as JSON string in database
   - Gallery page displays the location

## Troubleshooting

### Map not showing
- Make sure Leaflet CSS is loaded (check browser console)
- Check that `leaflet` and `react-leaflet` are installed
- Try clearing browser cache

### Geolocation not working
- Make sure browser supports Geolocation API
- Check that location permissions are granted
- Some browsers require HTTPS for geolocation

### Location not displaying in gallery
- Check that location is stored correctly in database
- Verify JSON format is correct
- Check browser console for errors

## Next Steps

After installation:
1. Run `npm install` to install dependencies
2. Test the upload page with both location methods
3. Verify locations are displayed correctly in gallery

