interface CricketLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function CricketLogo({ size = 'md', showText = true, className = '' }: CricketLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Cricket Ball Logo */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-sm opacity-50"></div>
        <div className="relative bg-red-600 rounded-full p-1 border-2 border-red-500">
          <div className="bg-white rounded-full p-1">
            <div className="bg-red-600 rounded-full w-full h-full flex items-center justify-center">
              {/* Cricket ball seam */}
              <div className="w-full h-0.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex items-baseline">
          <span className={`font-bold text-yellow-400 ${textSizes[size]}`}>
            Peak
          </span>
          <span className={`font-bold text-yellow-400 ${textSizes[size]}`}>
            form
          </span>
        </div>
      )}
    </div>
  )
}
