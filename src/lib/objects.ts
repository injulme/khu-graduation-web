import type { WasteObject } from './waste'

export type ObjectInfo = {
  title: string
  color: string
  type: string
  description: string
}

export const OBJECT_INFO: Partial<Record<WasteObject, ObjectInfo>> = {
  'cup-noodle': {
    title: 'AMBER CUP',
    color: '#ED8B30',
    type: 'Paper',
    description:
      '길거리 쓰레기들 사이에서 발견한 따뜻한 주황빛. 일상적으로 사용되던 용기가 버려진 뒤에도 소비의 순간을 떠올리게 하는 색을 간직한다.',
  },
  'can-tuna': {
    title: 'RUST YELLOW',
    color: '#EDD71A',
    type: 'Metal',
    description:
      '버려진 캔의 뚜껑에서 발견한 오래된 노란빛. 작은 금속 조각 하나가 주변의 회색 풍경과 대비되며 강한 존재감을 남긴다.',
  },
  'can-coke-crushed': {
    title: 'CRUSHED SILVER',
    color: '#C1C5CE',
    type: 'Metal',
    description:
      '짓눌린 캔에서 발견한 거칠고 차가운 은색. 반짝이던 금속은 찌그러진 뒤에도 빛을 잃지 않은 채 바닥에 남아 있다.',
  },
  'box-foam': {
    title: 'STAINED WHITE',
    color: '#FAFAFA',
    type: 'Other',
    description:
      '풀숲 사이에 버려진 용기에서 발견한 탁한 흰색. 깨끗한 표면 위로 자연의 흔적이 겹쳐지며 버려진 시간을 드러낸다.',
  },
  'cup-yogurt': {
    title: 'MURSKY MILK',
    color: '#E9DBB4',
    type: 'Plastic',
    description:
      '깨끗한 흰 플라스틱 용기 속 비치는 바나나 우유의 색. 자연의 어두운 색과 대비되며 너무 익숙해서 쉽게 지나치는 일상의 색을 드러낸다.',
  },
  'glove-black': {
    title: 'FADED BLACK',
    color: '#46474C',
    type: 'Other',
    description:
      '길 위에 버려진 장갑에서 발견한 바랜 검정색. 한때 누군가의 손을 감싸던 물건은 차가운 바닥 위에 홀로 남아 있다.',
  },
  'can-coke': {
    title: 'RUST RED',
    color: '#F23333',
    type: 'Metal',
    description:
      '물 속에 빠진 찌그러진 캔에서 발견한 익숙한 붉은색. 수많은 사람에게 익숙한 브랜드의 색이 소비 이후에는 거리의 흔적으로 남는다.',
  },
  'cap-blue': {
    title: 'DIRTY COBALT',
    color: '#96A942',
    type: 'Plastic',
    description:
      '아스팔트 위 흩어진 병뚜껑의 선명한 코발트색. 작고 가벼운 플라스틱 조각은 발길에 밀려나며 도시 곳곳에 남겨진다.',
  },
  'glove-purple': {
    title: 'WORN VIOLET',
    color: '#8944BB',
    type: 'Other',
    description:
      '길 위에 버려진 장갑에서 발견한 낡은 보랏빛. 한때 손을 보호하던 물건은 이제 차가운 바닥 위에 홀로 남아 있다.',
  },
  'ashtray-jar': {
    title: 'WORN BLACK',
    color: '#272929',
    type: 'Other',
    description:
      '폐자재 속 버려진 검은 물체에서 발견한 낡은 검정색. 부서지고 뒤섞인 잔해 속에서 한때의 물건은 형태만 남긴 채 놓여 있다.',
  },
  'box-adidas': {
    title: 'ABANDONED COBALT',
    color: '#015BD8',
    type: 'Paper',
    description:
      '쓰레기 사이에 놓인 상자에서 발견한 선명한 코발트색. 익숙한 브랜드의 색은 소비가 끝난 순간, 도시의 잔해 속으로 남겨졌다.',
  },
  'lid-red': {
    title: 'BIN ORANGE',
    color: '#F44E1C',
    type: 'Plastic',
    description:
      '낡은 플라스틱 상자에서 발견한 따뜻한 주황색. 버려진 물건은 본래의 용도를 잃고도 강한 색만큼은 그대로 간직한다.',
  },
  'box-stack': {
    title: 'CARDBOARD GOLD',
    color: '#E1C157',
    type: 'Paper',
    description:
      '찌그러진 캔의 틈에서 번지는 어두운 에메랄드색. 한때 가득 차 있던 음료는 사라지고, 구겨진 금속만이 거리 위에 남았다.',
  },
  'can-gatorade': {
    title: 'CRUSHED EMERALD',
    color: '#2DB057',
    type: 'Metal',
    description:
      '찌그러진 캔의 틈에서 번지는 어두운 에메랄드색. 한때 가득 차 있던 음료는 사라지고, 구겨진 금속만이 거리 위에 남았다.',
  },
  'cup-coffee': {
    title: 'STAINED BLACK',
    color: '#515353',
    type: 'Paper',
    description:
      '버려진 커피컵과 담배꽁초에서 발견한 탁한 검정색. 한 번의 소비가 남긴 작은 흔적들이 길 위에 겹겹이 쌓여 있다.',
  },
  'handle-yellow': {
    title: 'PLASTIK YELLOW',
    color: '#FCE435',
    type: 'Plastic',
    description:
      '아스팔트 위 노란 조각에서 발견한 강렬한 신호색. 위험을 알리는 듯한 색이지만 반복되는 거리의 풍경 속에서는 쉽게 무시된다.',
  },
  'part-blue': {
    title: 'WORN AQUA',
    color: '#63E5FD',
    type: 'Plastic',
    description:
      '돌 사이에 놓인 낡은 물건에서 발견한 옅은 아쿠아색. 자연의 색 사이에 남겨진 인공적인 빛은 어색하게 풍경에 섞여 있다.',
  },
  'straw-red': {
    title: 'PLASTIK RED',
    color: '#E82C33',
    type: 'Plastic Film',
    description:
      '돌무더기 위 길게 놓인 빨대에서 발견한 선명한 붉은색. 작고 가벼운 물건 하나가 자연의 무채색 풍경 속에서 예상치 못한 색의 흔적을 남긴다.',
  },
}

export function inkOn(bg: string) {
  const h = bg.replace('#', '').trim()
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.42 ? '#141414' : '#ffffff'
}
