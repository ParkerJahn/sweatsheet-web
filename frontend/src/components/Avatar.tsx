interface AvatarProps {
    profile: {
        first_name: string;
        last_name: string;
    };
}

function Avatar({ profile }: AvatarProps) {
    const getInitials = () => {
        return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    };

    const getRandomColor = () => {
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: getRandomColor() }}
        >
            <span>{getInitials()}</span>
        </div>
    );
}

export default Avatar;