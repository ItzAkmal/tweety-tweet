import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Layout from '../../components/Layouts/Layout'
import useAuthorization from '../../hooks/useAuthorization'
import { signin } from '../../store/actions/authActions'
import { setError, setSuccess } from '../../store/actions/notificationActions'
import Button from '../../ui/components/Button'
import Input from '../../ui/components/Input'

const Singin = () => {
	const router = useRouter()
	const dispatch = useDispatch()
	const auth = useAuthorization()

	useEffect(() => {
		if (Boolean(router.query.redirect)) {
			dispatch(setError('Please sign in to view this page'))
		}
	}, [router.query])

	useEffect(() => {
		if (auth.signedIn) {
			dispatch(setSuccess('Successfully signed in'))
			router.push('/home')
		}
	}, [auth])

	const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
		e.preventDefault()

		const formData = new FormData(e.target)

		if (formData.get('email') === '' || formData.get('password') === '') {
			dispatch(setError('One or more fields are empty'))
			return
		}

		const data = {
			email: formData.get('email') as string,
			password: formData.get('password') as string,
		}

		dispatch(signin(data))
	}

	return (
		<Layout title='Sign In | Fleet'>
			<div className='flex justify-center w-full h-screen px-2 bg-dark-700 md:px-0'>
				<form onSubmit={handleSubmit} action='submit' className='flex flex-col mt-20 w-96'>
					<span className='my-4 text-5xl italic font-bold text-center text-white'>Sign in</span>
					<Input label='Email' type='email' name='email' />
					<Input label='Password' type='password' name='password' />
					<div className='flex items-center justify-between w-full py-2 mt-3'>
						<span className='text-white'>
							<span className='mr-2'>Not signed up yet?</span>
							<div className='text-brand-400 hover:underline'>
								<Link href='/signup'>Sign up</Link>
							</div>
						</span>
						<Button variant='filled' type='submit'>
							Sign in
						</Button>
					</div>
				</form>
			</div>
		</Layout>
	)
}

export default Singin
