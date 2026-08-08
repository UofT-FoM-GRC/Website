import AthleticsCentre from '../assets/AthleticsCentre.png'
import DataDriven from '../assets/DataDriven.jpg'
import FoMSky from '../assets/FoM_Sky.png'
import GoldringCentre from '../assets/GoldringCentre.png'
import GRCHero from '../assets/GRC_Hero.png'
import HartHouse from '../assets/HartHouse.png'
import HelpingStudents from '../assets/HelpingStudents.png'
import SavingsPolicy from '../assets/SavingsPolicy.png'

const legacyAssets: Record<string, string> = {
	'AthleticsCentre.png': AthleticsCentre.src,
	'DataDriven.jpg': DataDriven.src,
	'FoM_Sky.png': FoMSky.src,
	'GoldringCentre.png': GoldringCentre.src,
	'GRC_Hero.png': GRCHero.src,
	'HartHouse.png': HartHouse.src,
	'HelpingStudents.png': HelpingStudents.src,
	'SavingsPolicy.png': SavingsPolicy.src
}

/** Existing source images retain Astro optimization; CMS uploads use public /assets paths. */
export const resolveCmsAsset = (path: string): string => legacyAssets[path] ?? path
