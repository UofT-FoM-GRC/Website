/**
 * Independent format-migration manifest. These facts came from the legacy
 * callouts, images, tables, and standalone actions; never derive it from src.
 */
export type ExpectedCallout = {
	kind: 'information' | 'important' | 'warning'
	title?: string
	facts: string[]
	listItems?: string[]
}

export type BlogMigration = {
	file: string
	callouts: ExpectedCallout[]
	images?: { src: string; description: string }[]
	actionLinks?: { url: string; label: string }[]
	legacyFacts?: string[]
}

export const blogMigration: BlogMigration[] = [
	{ file: 'biorender-for-students.md', callouts: [] },
	{
		file: 'free-writing-support.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'Thanks to U of T’s institutional membership, all graduate students are eligible to enrol in NCFDD’s highly regarded programs, including the Dissertation Success Curriculum and the 14-Day Writing Challenge.'
				]
			}
		]
	},
	{
		file: 'hbfa-2025-26-update.md',
		callouts: [
			{
				kind: 'warning',
				facts: [
					'Not all money counts as a scholarship for top-up purposes. The following do NOT qualify for top-ups:',
					'University of Toronto Fellowships (including departmental fellowships)',
					'Doctoral Completion Awards',
					'Temerty Faculty of Medicine Entrance Scholarships',
					'GSS (Graduate Student Supplement) funds',
					'Travel awards',
					'Bursaries'
				],
				listItems: [
					'University of Toronto Fellowships (including departmental fellowships)',
					'Doctoral Completion Awards',
					'Temerty Faculty of Medicine Entrance Scholarships',
					'GSS (Graduate Student Supplement) funds',
					'Travel awards',
					'Bursaries'
				]
			}
		],
		legacyFacts: [
			'Domestic MSc (2024-25) Living Allowance: $29,819.88 Tuition & Fees: $9,438.48 UHIP: — Total Base Funding: $39,258.36',
			'Domestic MSc (2025-26) Living Allowance: $29,819.88 Tuition & Fees: $9,608.48 UHIP: — Total Base Funding: $39,428.36',
			'Domestic PhD Living Allowance: $32,910.48 Tuition & Fees: $8,448.48 UHIP: — Total Base Funding: $41,358.96',
			'International MSc Living Allowance: $29,819.88 Tuition & Fees: $34,108.48 UHIP: $756.00 Total Base Funding: $64,684.36',
			'International PhD Living Allowance: $32,910.48 Tuition & Fees: $8,448.48 UHIP: $756.00 Total Base Funding: $42,114.96',
			"Your Total Scholarship Amount: $0 to $2,000 What Happens: You keep the full amount. It doesn't reduce your base funding. Top-Up Amount: No top-up",
			'Your Total Scholarship Amount: $2,001 to $9,999 What Happens: Goes toward base funding Top-Up Amount: $2,000 top-up',
			'Your Total Scholarship Amount: $10,000 to $15,000 What Happens: Goes toward base funding Top-Up Amount: $3,000 top-up',
			'Your Total Scholarship Amount: $15,001 to $39,999 What Happens: Goes toward base funding Top-Up Amount: $4,000 top-up',
			'Your Total Scholarship Amount: $40,000 to $45,000 What Happens: Goes toward base funding Top-Up Amount: $5,000 top-up ⭐ New!',
			'Your Total Scholarship Amount: $45,001 to $50,000 What Happens: You keep up to $50,000 total Top-Up Amount: No top-up',
			'Your Total Scholarship Amount: Over $50,000 What Happens: You can only keep $50,000 Top-Up Amount: No top-up'
		]
	},
	{
		file: 'hbfa-explained.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'When defining your Graduate Education Management System (GEMS) budget, use the table above to fill in the appropriate amounts for tuition fees and living allowance. Your "Guaranteed Base Funding" row found in that application should match the stipend amount.'
				]
			},
			{
				kind: 'warning',
				facts: [
					'Unfortunately, there are certain scholarships/awards that do not qualify for the top-up. These include:',
					'UofT Fellowships, including departmental fellowships',
					'Doctoral Completion Awards',
					'Entrance Scholarships',
					'GSS funds',
					'Travel grants/awards',
					'Bursaries'
				],
				listItems: [
					'UofT Fellowships, including departmental fellowships',
					'Doctoral Completion Awards',
					'Entrance Scholarships',
					'GSS funds',
					'Travel grants/awards',
					'Bursaries'
				]
			}
		],
		images: [
			{
				src: '/assets/hbfa-2024-2025.webp',
				description: 'HBFA 2024/2025 Base Funding Table for MSc and PhD Students - Domestic and International'
			}
		]
	},
	{
		file: 'ims-career-mentorship-2024.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'The IMS Career Mentorship Program (CMP) connects upper-year MSc and PhD students with experienced IMS alumni and faculty mentors in their desired career paths. Registration for the 2024-2025 program is now open!'
				]
			},
			{
				kind: 'information',
				facts: [
					'Attend the virtual information session on January 8 at 3:00 pm to learn more about the program and application process.',
					'Register here'
				]
			},
			{
				kind: 'important',
				title: 'Important Dates',
				facts: [
					'Information Session: January 8, 2025 at 3:00 pm',
					'Application Deadline: January 23, 2025',
					'Mentor-Mentee Matching: Completed by end of February'
				],
				listItems: [
					'Information Session: January 8, 2025 at 3:00 pm',
					'Application Deadline: January 23, 2025',
					'Mentor-Mentee Matching: Completed by end of February'
				]
			},
			{
				kind: 'information',
				facts: [
					'Questions about the program? Contact the CMP team:',
					'Sarah Topa (CMP Manager)',
					'Shaghayegh Foroozan (Program Coordinator)'
				],
				listItems: ['Sarah Topa (CMP Manager)', 'Shaghayegh Foroozan (Program Coordinator)']
			}
		]
	},
	{
		file: 'one-password-promo-2025.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'UofT Information Security is offering students a free 1Password Families account for 6 years and 3 months. This covers you plus 4 family members. No credit card needed.'
				]
			},
			{ kind: 'important', facts: ['WJZ2ACI2MVVC'] },
			{ kind: 'warning', facts: ['This token was last updated on July 15, 2024.'] }
		],
		images: [{ src: '/assets/1Password-create-account.webp', description: '1Password account creation page' }]
	},
	{
		file: 'refworks-pro-free.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'RefWorks is a powerful reference management tool that helps you collect, organize, and format citations for your research papers. As a UofT student, you have free access to RefWorks Pro!'
				]
			},
			{ kind: 'information', facts: ['Remember to bookmark the login page for easy access in the future!'] },
			{
				kind: 'warning',
				facts: ['Do not click on "Use login from my institution" as this feature is currently not working properly']
			},
			{
				kind: 'warning',
				facts: ['You may see the "Use login from my institution" option again. Do not click on it!']
			},
			{
				kind: 'information',
				facts: [
					'Take advantage of the built-in tutorials to learn how to make the most of RefWorks Pro for your research!'
				]
			}
		]
	},
	{
		file: 'robarts-family-study-space.md',
		callouts: [],
		actionLinks: [
			{
				url: 'http://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fforms.office.com%2Fr%2FM7E9GMurvs&data=05%7C01%7Ckristy.wheaton%40utoronto.ca%7Cf34e93d99aa8429b70d508da876b9e75%7C78aac2262f034b4d9037b46d56c55210%7C0%7C0%7C637971193525776107%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=FruIIpGZIMVEmhiX2hz%2FStlqNLo4susG1pOCNKOV8d8%3D&reserved=0',
				label: 'Register using this form to get your key-fob for access to the space'
			}
		]
	},
	{
		file: 'rom-free-tuesdays-uoft-students-2025.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'Full-time UofT students get free admission to the Royal Ontario Museum every Tuesday. Just show your student ID at the ticket desk.'
				]
			},
			{
				kind: 'warning',
				facts: [
					"Special exhibitions sometimes require an additional fee, even on Tuesdays. Check the ROM website before visiting if there's a specific exhibit you want to see."
				]
			}
		]
	},
	{ file: 'unlock-linkedin-learning-uoft-faculty-ta.md', callouts: [] },
	{ file: 'uoft-award-explorer.md', callouts: [] },
	{ file: 'uoft-career-fair-2024.md', callouts: [] },
	{ file: 'uoft-free-coursera-access.md', callouts: [] },
	{
		file: 'uoft-free-matlab.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'MATLAB is an industry-standard programming platform designed for engineers and scientists, featuring powerful tools for data analysis, visualization, and algorithm development. As a UofT student, you have free access to MATLAB and its extensive toolbox collection!'
				]
			},
			{ kind: 'warning', facts: ['Only use your UofT email address when creating your account'] },
			{
				kind: 'information',
				facts: [
					'Need help after downloading? During the 2024-2025 academic year, we have MATLAB users on the GRC team who would be happy to assist you!'
				]
			},
			{
				kind: 'information',
				facts: [
					'Your MATLAB license includes access to Simulink and various toolboxes that can enhance your research capabilities!'
				]
			}
		]
	},
	{
		file: 'uoft-hiring-tas.md',
		callouts: [],
		actionLinks: [{ url: 'https://unit1.hrandequity.utoronto.ca/', label: 'Explore Open TA Positions Here' }]
	},
	{
		file: 'uoft-zoom-pro.md',
		callouts: [
			{
				kind: 'information',
				facts: [
					'As a UofT student, you have access to a free Zoom Pro account that removes the 40-minute meeting limit and provides additional features!'
				]
			},
			{
				kind: 'information',
				facts: [
					'The profile dashboard is where you can customize your Zoom settings, including meeting preferences, security options, and recording settings.'
				]
			},
			{
				kind: 'important',
				facts: [
					"Always ensure you're logged in with your UofT account when hosting meetings to take advantage of the Pro features!"
				]
			},
			{
				kind: 'information',
				facts: [
					"Your UofT Zoom Pro account is available as long as you're an active student. Make the most of it for your academic collaborations!"
				]
			}
		],
		images: [{ src: '/assets/zoom-sso.webp', description: 'Zoom SSO' }]
	}
]
