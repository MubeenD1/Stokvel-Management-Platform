import { useState, useEffect } from 'react';
import {useAuth } from '../context/AuthContext'

export default function MemberList({groupId}) {
    const {currentUser} = useAuth()
    const [member, setMembers] = useState([])
    const [currentUserRole, setCurrentUserRole] = useState(null)
    const [loading, setLoading] = useState(true)

    //To do
    //useEffect(() => {
    //     const fetchMembers = async () => {
    //         const token = await currentUser.getIdToken()
    //         const res = await fetch(`/api/groups/${groupId}/members`, {
    //             headers: {Auuthorisation: `Bearer ${token}`}
    //         })
    //         const data =  await res.json()
    //         setMembers(data.members)
    //         setCurrentUserRole(data.currentUserRole)
    //         setLoading(false)
            
    //     }
    //     fetchMembers()
    // }, [groupId])
    //Placeholder
    //Placeholder data until backend is ready
    useEffect (() => {
        setMembers([
            {id: '1', email: 'admin@test.com', role: 'ADMIN'},
            {id: '2', email: 'member@test.com', role: 'MEMBER'},
            {id: '3', email: 'treasurer@test.com', role: 'TREASURER'},
        ])
        setCurrentUserRole('ADMIN')
        setLoading(false)
        
    }, [])

    const handleRoleChange = async (userId, newRole) => {
        try {
            const token = await currentUser.getIdToken()
            const res = await fetch(`/api/groups/${groupId}/members/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorisation: `Bearer ${token}`
                }, 
                body: JSON.stringify({role: newRole})
            })

            if (!res.ok) throw new Error('Failed to update role')

            setMembers(prev => 
                prev.map(member => 
                    member.id === userId ? { ...member, role: newRole} : member
                )
            )
        } catch (error) {
            console.error(err)
            alert('Failed to update role')
        }
    }

    return (
        <div>
      <h2>Group Members</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.email}</td>
              <td>
                {currentUserRole === 'ADMIN' ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="TREASURER">Treasurer</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  member.role
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    )
}