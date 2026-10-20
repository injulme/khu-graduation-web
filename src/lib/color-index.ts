export type ColorEntry = {
  no: number
  name: string
  group: string
}

export const COLOR_INDEX: ColorEntry[] = [
  { no: 1, name: 'Crushed Red', group: 'Red' },
  { no: 2, name: 'Bag Crimson', group: 'Red' },
  { no: 3, name: 'Faded Scarlet', group: 'Red' },
  { no: 4, name: 'Bottle Red', group: 'Red' },
  { no: 5, name: 'Label Pink', group: 'Red' },
  { no: 6, name: 'Net Pink', group: 'Red' },
  { no: 7, name: 'Waste Coral', group: 'Red' },
  { no: 8, name: 'Bucket Rose', group: 'Red' },
  { no: 9, name: 'Can Scarlet', group: 'Red' },
  { no: 10, name: 'Plastic Orange', group: 'Orange' },
  { no: 11, name: 'Bag Orange', group: 'Orange' },
  { no: 12, name: 'Rust Orange', group: 'Orange' },
  { no: 13, name: 'Bottle Amber', group: 'Orange' },
  { no: 14, name: 'Glass Amber', group: 'Orange' },
  { no: 15, name: 'Ash Brown', group: 'Brown' },
  { no: 16, name: 'Plastic Yellow', group: 'Yellow' },
  { no: 17, name: 'Discard Yellow', group: 'Yellow' },
  { no: 18, name: 'Faded Yellow', group: 'Yellow' },
  { no: 19, name: 'Acid Lime', group: 'Yellow' },
  { no: 20, name: 'Film Yellow', group: 'Yellow' },
  { no: 21, name: 'Package Yellow', group: 'Yellow' },
  { no: 22, name: 'Dust Yellow', group: 'Yellow' },
  { no: 23, name: 'Stained Lime', group: 'Green' },
  { no: 24, name: 'Plastic Lime', group: 'Green' },
  { no: 25, name: 'Bottle Green', group: 'Green' },
  { no: 26, name: 'Net Green', group: 'Green' },
  { no: 27, name: 'Polluted Green', group: 'Green' },
  { no: 28, name: 'Bin Green', group: 'Green' },
  { no: 29, name: 'Sofa Cyan', group: 'Blue' },
  { no: 30, name: 'Plastic Cyan', group: 'Blue' },
  { no: 31, name: 'Can Blue', group: 'Blue' },
  { no: 32, name: 'Box Blue', group: 'Blue' },
  { no: 33, name: 'Faded Blue', group: 'Blue' },
  { no: 34, name: 'Bag Blue', group: 'Blue' },
  { no: 35, name: 'Cap Violet', group: 'Purple' },
  { no: 36, name: 'Fabric Violet', group: 'Purple' },
  { no: 37, name: 'Glove Violet', group: 'Purple' },
  { no: 38, name: 'Can Crimson', group: 'Red' },
  { no: 39, name: 'Garbage Black', group: 'Black' },
  { no: 40, name: 'Foam White', group: 'White' },
  { no: 41, name: 'Bottle Clear', group: 'White' },
  { no: 42, name: 'Plastic White', group: 'White' },
]

export const colorLabel = (e: ColorEntry) => `( ${String(e.no).padStart(3, '0')} ) ${e.name}`
