/**
 * Pre-migration public-content baseline. Keep literals independent from src/
 * content so a migration cannot update the expected contract by construction.
 */
type Image = { src: string; alt: string }

type BlogContract = {
	route: string
	title: string
	description: string
	hero: Image
	headings: string[]
	headingLevels: (2 | 3 | 4)[]
	bodyText: string
	links: { text: string; href: string }[]
	inlineImages?: Image[]
}

type ResourceContract = { route: string; fixture: string; anchors: string[] }

export const contentContract: { blogs: BlogContract[]; resources: ResourceContract[] } = {
	blogs: [
		{
			route: '/blog/biorender-for-students/',
			title: 'Biorender for Students',
			description: 'Make scientific illustrations like a pro.',
			hero: { src: '/assets/biorenderlogo.webp', alt: 'BioRender logo' },
			headings: [
				'Create innovative and eye-catching illustrations using BioRender',
				'Students can access BioRender at discounted pricing in four ways:'
			],
			headingLevels: [2, 2],
			bodyText:
				'U of T students can access BioRender, a scientific illustration software, through their university affiliation to create figures for academic purposes such as presentations, posters, and theses.',
			links: [{ text: 'BioRender website', href: 'https://www.biorender.com/pricing' }]
		},
		{
			route: '/blog/free-writing-support/',
			title: 'Free Writing and Dissertation Support for UofT Graduate Students',
			description:
				'UofT offers free access to professional development programming to support your thesis/dissertation writing task through NCFDD',
			hero: { src: '/assets/writing-logo.webp', alt: 'Writing support logo' },
			headings: [
				'Boost Your Graduate Journey with Free NCFDD Programming at UofT',
				'What is NCFDD?',
				'Programs You Can Access',
				'Dissertation Success Curriculum',
				'14-Day Writing Challenge',
				'How To Get Started',
				'Take Advantage of this Opportunity'
			],
			headingLevels: [2, 3, 3, 4, 4, 3, 2],
			bodyText:
				'Thanks to U of T’s institutional membership, all graduate students are eligible to enrol in NCFDD’s highly regarded programs, including the Dissertation Success Curriculum and the 14-Day Writing Challenge.',
			links: [
				{ text: 'Dissertation Success Curriculum', href: 'https://members.ncfdd.org/dissertation-success-public' },
				{ text: '14-Day Writing Challenge', href: 'https://members.ncfdd.org/14-day-challenge' }
			]
		},
		{
			route: '/blog/hbfa-2025-26-update/',
			title: 'HBFA Updates for 2025-26',
			description: 'New top-up tier and updated funding amounts for the 2025-26 academic year',
			hero: {
				src: '/assets/fom-backgrounds/ffom-zoom-backgrounds-5-1080.webp',
				alt: 'Faculty of Medicine branded background'
			},
			headings: [
				"What's New This Year",
				'Base Funding for 2025-26',
				'How Scholarship Top-Ups Actually Work',
				'A Real Example',
				'The Fine Print Gotchas',
				'How Long Does Funding Last?',
				'Use this Information for GEMS'
			],
			headingLevels: [2, 2, 2, 3, 3, 2, 2],
			bodyText: "there's now a $5,000 top-up for students who receive cumulative awards between $40,000 and $45,000.",
			links: []
		},
		{
			route: '/blog/hbfa-explained/',
			title: 'The HBFA Explained - 2024/2025',
			description:
				'A succinct explanation of the Harmonized Base Funding Agreement (HBFA) and its impact on graduate students',
			hero: {
				src: '/assets/fom-backgrounds/ffom-zoom-backgrounds-4-1080.webp',
				alt: 'Faculty of Medicine branded background'
			},
			headings: ['Key Highlights of the HBFA'],
			headingLevels: [2],
			bodyText:
				'The Harmonized Base Funding Agreement (HBFA) is a crucial component of your graduate experience at the University of Toronto.',
			links: [],
			inlineImages: [
				{
					src: '/assets/hbfa-2024-2025.webp',
					alt: 'HBFA 2024/2025 Base Funding Table for MSc and PhD Students - Domestic and International'
				}
			]
		},
		{
			route: '/blog/ims-career-mentorship-2024/',
			title: 'IMS Career Mentorship Program 2024-2025',
			description: 'The Institute of Medical Science Career Mentorship Program is now accepting mentee applications',
			hero: { src: '/assets/mentor-mentee.webp', alt: 'Two people meeting for mentorship' },
			headings: [
				'Program Overview',
				'Program Benefits',
				'Eligibility Requirements',
				'Mentee Responsibilities',
				'How to Apply'
			],
			headingLevels: [2, 2, 2, 2, 2],
			bodyText:
				'The IMS Career Mentorship Program (CMP) connects upper-year MSc and PhD students with experienced IMS alumni and faculty mentors in their desired career paths.',
			links: [
				{
					text: 'Register here',
					href: 'https://utoronto.zoom.us/meeting/register/tZErdOusqzkuGddnERQ4_7GzfIFtJwbibufs#/registration'
				},
				{
					text: 'online portal',
					href: 'https://forms.office.com/Pages/ResponsePage.aspx?id=JsKqeAMvTUuQN7RtVsVSEBzdxFQfjWlLsOh7tn2HAvhUMEtETERNUkkySzBVUVQyMjJYQUw2WUVDSS4u'
				}
			]
		},
		{
			route: '/blog/one-password-promo-2025/',
			title: 'Free 1Password for UofT Students: 6+ Years of Secure Password Management',
			description:
				'UofT students can get 1Password Families free for over 6 years, covering you and up to 4 family members.',
			hero: { src: '/assets/1Password-logo.webp', alt: '1Password logo' },
			headings: [
				'Why Bother with a Password Manager?',
				'Setting Up Your Account',
				'Step 1: Visit the Redemption Page',
				'Step 2: Enter the Company Token',
				'Step 3: Enter Your Student Email',
				'Step 4: Redeem Your Account',
				'Step 5: Check Your Email',
				'Step 6: Create Your Account',
				'Adding Family Members',
				'Getting Started',
				'Tips'
			],
			headingLevels: [2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 2],
			bodyText:
				'UofT Information Security is offering students a free 1Password Families account for 6 years and 3 months.',
			links: [{ text: 'https://1password.com/promo/', href: 'https://1password.com/promo/' }],
			inlineImages: [{ src: '/assets/1Password-create-account.webp', alt: '1Password account creation page' }]
		},
		{
			route: '/blog/refworks-pro-free/',
			title: 'Free RefWorks Pro for UofT Students',
			description: 'RefWorks Pro is a free resource for UofT students.',
			hero: { src: '/assets/refworks-banner.webp', alt: 'RefWorks logo on a banner' },
			headings: ['Getting Started'],
			headingLevels: [2],
			bodyText:
				'RefWorks is a powerful reference management tool that helps you collect, organize, and format citations for your research papers.',
			links: [
				{ text: 'UofT RefWorks Portal', href: 'https://refworks-proquest-com.myaccess.library.utoronto.ca/' },
				{ text: 'RefWorks', href: 'https://refworks.proquest.com/' }
			]
		},
		{
			route: '/blog/robarts-family-study-space/',
			title: 'Study Spaces for Graduate Students with Children',
			description: 'New study spaces designed for graduate students with children',
			hero: { src: '/assets/robarts-family-study-space.webp', alt: 'Family study space at Robarts Library' },
			headings: [
				'Study space while caring for children',
				"So What's Different About This Space?",
				'Who Can Use It?',
				'How to Get Access',
				'A Few House Rules'
			],
			headingLevels: [2, 2, 2, 2, 2],
			bodyText: 'They’ve created a Family Study Space at Robarts Library.',
			links: [
				{
					text: 'Register using this form to get your key-fob for access to the space',
					href: 'http://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fforms.office.com%2Fr%2FM7E9GMurvs&data=05%7C01%7Ckristy.wheaton%40utoronto.ca%7Cf34e93d99aa8429b70d508da876b9e75%7C78aac2262f034b4d9037b46d56c55210%7C0%7C0%7C637971193525776107%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=FruIIpGZIMVEmhiX2hz%2FStlqNLo4susG1pOCNKOV8d8%3D&reserved=0'
				}
			]
		},
		{
			route: '/blog/rom-free-tuesdays-uoft-students-2025/',
			title: 'The ROM is Free on Tuesdays for UofT Students',
			description: 'UofT students can access the Royal Ontario Museum for free every Tuesday with their student ID.',
			hero: { src: '/assets/rom-dinosaur-fossil.webp', alt: 'Dinosaur fossil exhibit at the Royal Ontario Museum' },
			headings: ['How It Works', "What's Included", 'Just FYI'],
			headingLevels: [2, 2, 2],
			bodyText: 'Full-time UofT students get free admission to the Royal Ontario Museum every Tuesday.',
			links: []
		},
		{
			route: '/blog/unlock-linkedin-learning-uoft-faculty-ta/',
			title: 'Unlock LinkedIn Learning as a UofT Faculty TA',
			description:
				'The University of Toronto Faculty TA LinkedIn Learning is a great opportunity to network with top employers and learn about potential career paths.',
			hero: { src: '/assets/linkedin-learning.webp', alt: 'LinkedIn Learning logo' },
			headings: [
				'Unlock LinkedIn Learning with your Faculty status',
				'Why Use LinkedIn Learning?',
				'How to Access LinkedIn Learning',
				'Benefits of LinkedIn Learning',
				'Make the Most of Your Faculty Status'
			],
			headingLevels: [2, 2, 2, 2, 2],
			bodyText: 'Are you a graduate student working as a Teaching Assistant (TA) at the University of Toronto?',
			links: []
		},
		{
			route: '/blog/uoft-award-explorer/',
			title: 'UofT Award Explorer',
			description:
				'The University of Toronto Award Explorer is a great resource for finding scholarships and awards tailored to your needs.',
			hero: { src: '/assets/waiter-serving-money.webp', alt: 'Person holding a tray of coins' },
			headings: [
				"Discover scholarships with UofT's Award Explorer",
				'Why Use Award Explorer?',
				'How to Access Award Explorer',
				'Tips for Maximizing Your Scholarship Search',
				'Make the Most of Your Opportunities'
			],
			headingLevels: [2, 2, 2, 2, 2],
			bodyText: 'Are you a graduate student at the University of Toronto looking for financial support?',
			links: [
				{ text: 'Award Explorer', href: 'https://awardexplorer.utoronto.ca/' },
				{ text: 'awardexplorer.utoronto.ca', href: 'https://awardexplorer.utoronto.ca/' }
			]
		},
		{
			route: '/blog/uoft-career-fair-2024/',
			title: 'UofT Career Fair 2024',
			description:
				'The University of Toronto Career Fair is a great opportunity to network with top employers and learn about potential career paths.',
			hero: { src: '/assets/uoft-career-fair-banner.webp', alt: 'University of Toronto Career Fair banner' },
			headings: ['Talk to potential employers', 'Event Highlights:', 'Why Attend?', 'Accessibility and Support:'],
			headingLevels: [2, 2, 2, 2],
			bodyText: 'Seeking meaningful work opportunities? Want to connect with top employers across various industries?',
			links: [{ text: 'Career Fair 2024 website', href: 'https://studentlife.utoronto.ca/uoft-career-fair/' }]
		},
		{
			route: '/blog/uoft-free-coursera-access/',
			title: 'Free Coursera Access for UofT Students',
			description: 'Coursera is a free resource for UofT students.',
			hero: { src: '/assets/coursera-logo.webp', alt: 'Coursera logo' },
			headings: [
				'Free Coursera access for U of T Medicine students',
				'What Does This Mean for You?',
				'How to Get Started',
				'Key Features',
				'New Career and Professional Skills Playlists',
				'Career Learning',
				'Professional Skills'
			],
			headingLevels: [2, 2, 3, 3, 3, 4, 4],
			bodyText:
				'We are thrilled to announce that the University of Toronto is now a proud member of the Coursera Partner Consortium!',
			links: [
				{
					text: 'U of T Student Account Creation',
					href: 'https://www.coursera.org/programs/coursera-for-university-of-toronto-ql0lg?authMode=signup&collectionId=AQ888&currentTab=CATALOG'
				}
			]
		},
		{
			route: '/blog/uoft-free-matlab/',
			title: 'Free MATLAB License',
			description: 'MATLAB is free for UofT students through the university license.',
			hero: { src: '/assets/matlab-banner.webp', alt: 'MATLAB logo on a blue banner' },
			headings: ['Getting Started', 'Downloading MATLAB'],
			headingLevels: [2, 2],
			bodyText:
				'MATLAB is an industry-standard programming platform designed for engineers and scientists, featuring powerful tools for data analysis, visualization, and algorithm development.',
			links: [
				{
					text: 'UofT MATLAB Portal',
					href: 'https://www.mathworks.com/academia/tah-portal/university-of-toronto-676468.html'
				}
			]
		},
		{
			route: '/blog/uoft-hiring-tas/',
			title: 'UofT Hiring TAs',
			description: 'How to hire Teaching Assistants at the University of Toronto',
			hero: {
				src: 'https://www.teachermagazine.com/assets/images/teacher/_articleimagetransform855x313/Teaching_assistants.jpg',
				alt: 'Teacher supporting a student in a classroom'
			},
			headings: ['Teaching Assistant Positions Available', 'Why Become a Teaching Assistant?', 'How to Apply'],
			headingLevels: [2, 2, 2],
			bodyText:
				'We are thrilled to share an excellent resource for those of you interested in becoming a Teaching Assistant (TA) at our university.',
			links: [{ text: 'Explore Open TA Positions Here', href: 'https://unit1.hrandequity.utoronto.ca/' }]
		},
		{
			route: '/blog/uoft-zoom-pro/',
			title: 'UofT Zoom Pro',
			description: 'The University of Toronto Zoom Pro is a great resource for graduate students.',
			hero: { src: '/assets/zoom-banner.webp', alt: 'Zoom logo on a banner' },
			headings: ['Getting Started', 'Using Pro Features in the Zoom App', 'Benefits of Your Zoom Pro Account'],
			headingLevels: [2, 2, 2],
			bodyText:
				'As a UofT student, you have access to a free Zoom Pro account that removes the 40-minute meeting limit and provides additional features!',
			links: [{ text: 'UofT Zoom Portal', href: 'https://utoronto.zoom.us/' }],
			inlineImages: [{ src: '/assets/zoom-sso.webp', alt: 'Zoom SSO' }]
		}
	],
	resources: [
		{ route: '/resources/employment/', fixture: 'employment.json', anchors: ['cupe', 'clnx', 'resources'] },
		{
			route: '/resources/career-planning-exploration/',
			fixture: 'career-planning-exploration.json',
			anchors: ['events', 'resources', 'tools']
		},
		{ route: '/resources/continuing-education/', fixture: 'continuing-education.json', anchors: ['scs'] },
		{
			route: '/resources/health-wellness/',
			fixture: 'health-wellness.json',
			anchors: ['events', 'appointments', 'workshops', 'telus', 'accessibility']
		},
		{ route: '/resources/housing/', fixture: 'housing.json', anchors: ['emergency', 'graduate'] },
		{ route: '/resources/other/', fixture: 'other.json', anchors: ['fitness', 'supervision'] },
		{
			route: '/resources/scholarships-bursaries-awards/',
			fixture: 'scholarships-bursaries-awards.json',
			anchors: ['general-award-explorer', 'sgs-awards', 'contacts']
		},
		{
			route: '/resources/scholarship-award-grant-application-support/',
			fixture: 'scholarship-award-grant-application-support.json',
			anchors: ['writing-centres', 'learning-support']
		}
	]
}
