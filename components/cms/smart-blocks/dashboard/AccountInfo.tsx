'use client'

import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'

export default function AccountInfo({ block, data, className }: SmartBlockProps) {
  const userName = (data.userName as string) || 'User'
  const userEmail = (data.userEmail as string) || ''
  const userAvatar = data.userAvatar as string | undefined
  const memberSince = data.memberSince as string | undefined

  const outer =
    className ||
    block.className ||
    'rounded-lg border border-gray-200 bg-white p-6'

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={outer}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
      <div className="flex items-center gap-4">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg font-semibold">
            {initials || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-900 truncate">{userName}</p>
          {userEmail && (
            <p className="text-sm text-gray-500 truncate">{userEmail}</p>
          )}
          {memberSince && (
            <p className="text-xs text-gray-400 mt-1">
              Member since{' '}
              {new Date(memberSince).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
