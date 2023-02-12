export default function Home() {
    return (<main className='flex min-h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-800 text-white'>
			<h1 className='mb-6 text-7xl font-semibold leading-7'>
				Hello from DaxStax{' '}
			</h1>
			<p>There are some steps you need to take before you start</p>
			<ol>
				<li>
					1- Uncomment the designated sections in the gitignore
					file
				</li>
			</ol>
		</main>);
}
