import axios from 'axios'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import useAuthorization from '../hooks/useAuthorization'
import { setError, setSuccess } from '../store/actions/notificationActions'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import CloseIcon from '../ui/icons/CloseIcon'
import Modal from '../ui/Modal'
import TextArea from '../ui/TextArea'
import { BASE_URL } from '../utils/config'
import { FleetType } from './Timeline'

interface Props {
	fleet: FleetType
	visible: boolean
	setVisible: (arg: boolean) => void
}

const ReplyComposer = ({ fleet, visible, setVisible }: Props) => {
	const [body, setBody] = useState('')
	const auth = useAuthorization()
	const dispatch = useDispatch()
	const queryClient = useQueryClient()
	const { pathname } = useRouter()
	const inputRef = useRef<HTMLTextAreaElement>(null)

	const composeReply = async () => {
		try {
			const res = await axios.post(
				`${BASE_URL}/fleet/reply/${fleet.id}`,
				{ body: body },
				{
					headers: {
						Authorization: `Bearer ${auth.token}`,
					},
				}
			)

			return res.data
		} catch (error) {
			if (error.response) dispatch(setError(error.response.data.message))
		}
	}

	const { mutate, isLoading } = useMutation(composeReply, {
		onSuccess: () => {
			dispatch(setSuccess('Reply sent'))
			setVisible(false)
			setBody('')
			if (pathname.startsWith('/home')) {
				queryClient.refetchQueries('fleets')
			} else if (pathname.startsWith('/profile')) {
				queryClient.refetchQueries('profile-fleets')
			} else if (pathname.startsWith('/fleet')) {
				queryClient.refetchQueries('fleet-details')
			}
		},
		onError: () => {
			dispatch(setError('An error occured while Replying to this fleet.'))
			setBody('')
		},
	})

	const onSubmit = () => {
		if (body === '') {
			dispatch(setError('Reply cannot be empty'))
		}
		if (body !== '' && !isLoading) {
			mutate()
		}
	}

	const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setBody(e.target.value)
	}

	const onEnterPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && e.shiftKey === false) {
			e.preventDefault()
			onSubmit()
		}
	}

	useEffect(() => {
		if (visible) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		}
	}, [visible])

	return (
		<Modal
			visible={visible}
			setVisible={setVisible}
			position='top'
			className='w-full bg-gray-800 rounded-lg shadow-lg h-80 md:w-2/5'
		>
			<div className='flex justify-end w-full'>
				<IconButton onClick={() => setVisible(false)}>
					<CloseIcon className='w-5 h-5 text-white transform hover:text-green-400 hover:scale-110' />
				</IconButton>
			</div>
			<div className='px-2 mt-4'>
				<div className='w-full px-2 py-2 mb-3 border border-gray-700 rounded-lg shadow-xl'>
					<div className='flex space-x-1'>
						<div className='flex items-center justify-center flex-shrink-0 w-12 h-12 mt-1 mr-2 overflow-hidden border-2 border-transparent rounded-lg'>
							<img
								src={
									fleet.author.isAdmin
										? 'http://github.com/FourLineCode.png'
										: 'http://github.com/RobinMalfait.png'
								}
								alt='profile-photo'
							/>
						</div>
						<div>
							<a className='text-base font-bold text-white'>
								<span>{fleet.author.displayName}</span>{' '}
								<span className='font-normal text-gray-400'>@{fleet.author.username}</span>
								{' • '}
								<span className='text-sm font-normal text-gray-400'>
									{formatDistanceToNow(new Date(fleet.createdAt))}
								</span>
							</a>
							<div className='text-sm text-white break-all'>{fleet.body}</div>
						</div>
					</div>
				</div>
				<TextArea
					value={body}
					onChange={onChange}
					onKeyDown={onEnterPress}
					label={`Reply to @${fleet.author.username}`}
					name='reply'
					ref={inputRef}
					className='h-24 text-white transition duration-150 bg-gray-800 focus:bg-gray-700'
				/>
				<div className='flex items-center justify-between w-full'>
					<span className={clsx(body.length > 240 ? 'text-red-600' : 'text-white')}>{body.length}/240</span>
					<Button variant='filled' onClick={onSubmit}>
						Reply
					</Button>
				</div>
			</div>
		</Modal>
	)
}

export default ReplyComposer